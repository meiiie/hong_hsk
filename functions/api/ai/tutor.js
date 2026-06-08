const DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
const DEFAULT_FALLBACK_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";
const MAX_BODY_BYTES = 24_000;
const MAX_QUESTION_CHARS = 400;
const MAX_MEMORY_CHARS = 2_400;
const MAX_HISTORY_MESSAGES = 10;
const MAX_OUTPUT_TOKENS = 520;
const PRIMARY_TIMEOUT_MS = 7_000;
const FALLBACK_TIMEOUT_MS = 42_000;
const STREAM_COMPLETION_TIMEOUT_MS = 38_000;

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-store",
  "Connection": "keep-alive",
};

const ACTIONS = new Set(["explain", "examples", "why_wrong", "memory_tip", "ask"]);

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: JSON_HEADERS,
  });
}

export async function onRequestPost(context) {
  try {
    const apiKey = context.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return jsonError("AI chưa được cấu hình secret NVIDIA_API_KEY.", 503);
    }

    const request = await parseRequestBody(context.request);
    if (!request) {
      return jsonError("Yêu cầu AI chưa đúng định dạng.", 400);
    }

    const model = cleanText(context.env.NVIDIA_MODEL) || DEFAULT_MODEL;
    const fallbackModel = cleanText(context.env.NVIDIA_FALLBACK_MODEL) || DEFAULT_FALLBACK_MODEL;
    const baseUrl = cleanText(context.env.NVIDIA_BASE_URL) || DEFAULT_BASE_URL;
    const models = buildModelPlan(model, fallbackModel);

    if (wantsStream(context.request, request)) {
      return streamResponse({
        apiKey,
        baseUrl,
        models,
        request,
      });
    }

    const providerResponse = await callNemotron({
      apiKey,
      baseUrl,
      models,
      request,
    });

    return jsonResponse({
      content: providerResponse.content,
      model: providerResponse.model,
      action: request.action,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof TutorRequestError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("AI tạm thời chưa phản hồi. Thử lại sau vài giây.", 502);
  }
}

async function parseRequestBody(request) {
  const text = await request.text();
  if (!text || text.length > MAX_BODY_BYTES) {
    return undefined;
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    return undefined;
  }

  if (!payload || typeof payload !== "object" || !ACTIONS.has(payload.action)) {
    return undefined;
  }

  const item = sanitizeItem(payload.item);
  if (!item) {
    return undefined;
  }

  return {
    action: payload.action,
    question: cleanText(payload.question).slice(0, MAX_QUESTION_CHARS),
    sessionId: cleanText(payload.sessionId),
    stream: Boolean(payload.stream),
    memoryMarkdown: cleanLongText(payload.memoryMarkdown).slice(0, MAX_MEMORY_CHARS),
    messages: sanitizeMessages(payload.messages),
    item,
    learner: sanitizeLearner(payload.learner),
    feedback: sanitizeFeedback(payload.feedback),
  };
}

function wantsStream(request, payload) {
  const accept = request.headers.get("accept") || "";
  return payload.stream || accept.includes("text/event-stream");
}

function sanitizeItem(item) {
  if (!item || typeof item !== "object") {
    return undefined;
  }

  const hanzi = cleanText(item.hanzi);
  if (!hanzi) {
    return undefined;
  }

  return {
    id: cleanText(item.id),
    book: cleanText(item.book),
    lesson: Number.isFinite(Number(item.lesson)) ? Number(item.lesson) : 0,
    lessonTitle: cleanText(item.lessonTitle),
    hanzi,
    pinyin: cleanText(item.pinyin),
    meaningVi: cleanText(item.meaningVi),
    meaningEn: cleanText(item.meaningEn),
    partOfSpeech: cleanText(item.partOfSpeech),
    exampleHan: cleanText(item.exampleHan),
    examplePinyin: cleanText(item.examplePinyin),
    exampleVi: cleanText(item.exampleVi),
    note: cleanText(item.note),
    source: cleanText(item.source),
  };
}

function sanitizeLearner(learner) {
  return {
    displayName: cleanText(learner?.displayName) || "Hồng",
    locale: cleanText(learner?.locale) === "en" ? "en" : "vi",
    studyMode: cleanText(learner?.studyMode) || "today",
  };
}

function sanitizeFeedback(feedback) {
  if (!feedback || typeof feedback !== "object") {
    return undefined;
  }

  return {
    input: cleanText(feedback.input),
    correct: Boolean(feedback.correct),
    revealed: Boolean(feedback.revealed),
  };
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => {
      if (!message || typeof message !== "object") {
        return undefined;
      }
      const role = cleanText(message.role);
      if (role !== "user" && role !== "assistant") {
        return undefined;
      }
      const content = cleanLongText(message.content).slice(0, 1_600);
      return content ? { role, content } : undefined;
    })
    .filter(Boolean);
}

function cleanText(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(/\s+/g, " ").trim().slice(0, 1_200);
}

function cleanLongText(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().slice(0, 4_000);
}

function buildModelPlan(primaryModel, fallbackModel) {
  const plan = [{ model: primaryModel, timeoutMs: PRIMARY_TIMEOUT_MS }];
  if (fallbackModel && fallbackModel !== primaryModel) {
    plan.push({ model: fallbackModel, timeoutMs: FALLBACK_TIMEOUT_MS });
  }
  return plan;
}

async function callNemotron({ apiKey, baseUrl, models, request }) {
  let lastError;

  for (const [index, entry] of models.entries()) {
    try {
      const content = await callNemotronModel({
        apiKey,
        baseUrl,
        model: entry.model,
        request,
        timeoutMs: entry.timeoutMs,
      });
      return { content, model: entry.model };
    } catch (error) {
      lastError = error;
      const canFallback = index < models.length - 1 && isRetryableProviderError(error);
      if (!canFallback) {
        throw error;
      }
    }
  }

  throw lastError ?? new TutorRequestError("AI tạm thời chưa phản hồi. Thử lại sau vài giây.", 502, true);
}

async function callNemotronModel({ apiKey, baseUrl, model, request, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: buildProviderMessages(request),
        temperature: 0.2,
        top_p: 0.75,
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw providerError(response.status);
    }

    const payload = await response.json();
    const content = cleanAiContent(payload?.choices?.[0]?.message?.content ?? "");
    if (typeof content !== "string" || !content.trim()) {
      throw new TutorRequestError("AI trả về phản hồi rỗng.", 502, true);
    }

    return content.trim();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new TutorRequestError("AI xử lý quá lâu. Thử lại với câu hỏi ngắn hơn.", 504, true);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function streamResponse({ apiKey, baseUrl, models, request }) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let keepAlive;
      const send = (event, data) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const comment = (message) => {
        controller.enqueue(encoder.encode(`: ${message}\n\n`));
      };

      try {
        send("status", { message: "Đang mở phiên gia sư HSK..." });
        keepAlive = setInterval(() => comment("keepalive"), 10_000);
        const providerResponse = await streamNemotron({
          apiKey,
          baseUrl,
          models,
          request,
          onStatus: (message) => send("status", { message }),
          onDelta: (content) => send("answer_delta", { content }),
        });

        send("metadata", {
          model: providerResponse.model,
          generatedAt: new Date().toISOString(),
          sessionId: request.sessionId || "",
        });
        send("done", { ok: true });
      } catch (error) {
        const message = error instanceof TutorRequestError
          ? error.message
          : "AI tạm thời chưa phản hồi. Thử lại sau vài giây.";
        send("error", { error: message });
      } finally {
        if (keepAlive) {
          clearInterval(keepAlive);
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: SSE_HEADERS,
  });
}

async function streamNemotron({ apiKey, baseUrl, models, request, onStatus, onDelta }) {
  let lastError;

  for (const [index, entry] of models.entries()) {
    try {
      onStatus(index === 0 ? "Đang thử Nemotron Ultra..." : "Ultra chậm, chuyển sang Nemotron Super...");
      const content = await streamNemotronModel({
        apiKey,
        baseUrl,
        model: entry.model,
        request,
        timeoutMs: entry.timeoutMs,
        onDelta,
      });
      return { content, model: entry.model };
    } catch (error) {
      lastError = error;
      const canFallback = index < models.length - 1 && isRetryableProviderError(error);
      if (!canFallback) {
        throw error;
      }
    }
  }

  throw lastError ?? new TutorRequestError("AI tạm thời chưa phản hồi. Thử lại sau vài giây.", 502, true);
}

async function streamNemotronModel({ apiKey, baseUrl, model, request, timeoutMs, onDelta }) {
  const controller = new AbortController();
  let timeout = setTimeout(() => controller.abort(), timeoutMs);
  let content = "";
  let sawFirstDelta = false;

  const extendAfterFirstDelta = () => {
    if (sawFirstDelta) {
      return;
    }
    sawFirstDelta = true;
    clearTimeout(timeout);
    timeout = setTimeout(() => controller.abort(), STREAM_COMPLETION_TIMEOUT_MS);
  };

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: buildProviderMessages(request),
        temperature: 0.2,
        top_p: 0.75,
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw providerError(response.status);
    }
    if (!response.body) {
      throw new TutorRequestError("NVIDIA chưa trả về stream.", 502, true);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    const parseBuffer = (flushTail = false) => {
      buffer = buffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      while (true) {
        const separatorIndex = buffer.indexOf("\n\n");
        if (separatorIndex === -1) {
          break;
        }
        const eventText = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        const delta = parseOpenAiStreamDelta(eventText);
        if (delta) {
          extendAfterFirstDelta();
          content += delta;
          onDelta(delta);
        }
      }

      if (flushTail && buffer.trim()) {
        const delta = parseOpenAiStreamDelta(buffer);
        if (delta) {
          extendAfterFirstDelta();
          content += delta;
          onDelta(delta);
        }
        buffer = "";
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        parseBuffer();
      }
    } finally {
      buffer += decoder.decode();
      parseBuffer(true);
      reader.releaseLock();
    }

    const cleaned = cleanAiContent(content);
    if (!cleaned) {
      throw new TutorRequestError("AI trả về phản hồi rỗng.", 502, true);
    }
    return cleaned;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new TutorRequestError(
        sawFirstDelta
          ? "AI bị ngắt giữa câu trả lời. Hỏi lại ngắn hơn hoặc thử lại sau vài giây."
          : "AI xử lý quá lâu. Thử lại với model nhanh hơn.",
        504,
        !sawFirstDelta,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseOpenAiStreamDelta(eventText) {
  const dataLines = eventText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());

  let delta = "";
  for (const dataLine of dataLines) {
    if (!dataLine || dataLine === "[DONE]") {
      continue;
    }
    try {
      const payload = JSON.parse(dataLine);
      delta += payload?.choices?.[0]?.delta?.content ?? "";
    } catch {
      // Ignore malformed provider chunks; a later chunk may still complete cleanly.
    }
  }
  return delta;
}

function isRetryableProviderError(error) {
  return error instanceof TutorRequestError && error.retryable;
}

function cleanAiContent(content) {
  if (typeof content !== "string") {
    return "";
  }

  return content
    .replace(/^Okay,?\s+[^.\n]{0,220}\.\s*/i, "")
    .replace(/^The user is asking[^.\n]{0,220}\.\s*/i, "")
    .trim();
}

function buildProviderMessages(request) {
  const messages = [
    {
      role: "system",
      content: buildSystemPrompt(),
    },
    {
      role: "user",
      content: buildContextPrompt(request),
    },
  ];

  if (request.messages?.length) {
    request.messages.forEach((message) => {
      messages.push({
        role: message.role,
        content: message.content,
      });
    });
  } else {
    messages.push({
      role: "user",
      content: buildUserPrompt(request),
    });
  }

  return messages;
}

function buildContextPrompt(request) {
  return [
    "Bối cảnh phiên học hiện tại. Dùng như dữ liệu nền, không lặp lại máy móc:",
    request.memoryMarkdown || "Chưa có bộ nhớ học tập.",
    "",
    "Thông tin thẻ hiện tại:",
    buildCardContext(request),
  ].join("\n");
}

function buildCardContext(request) {
  const { item, learner, feedback } = request;
  return [
    `Người học: ${learner.displayName}; ngôn ngữ giao diện: ${learner.locale}; chế độ học: ${learner.studyMode}.`,
    `Từ hiện tại: ${item.hanzi}`,
    `Pinyin: ${item.pinyin || "chưa có"}`,
    `Nghĩa tiếng Việt trong dữ liệu: ${item.meaningVi || "chưa có"}`,
    `Nghĩa tiếng Anh dự phòng: ${item.meaningEn || "chưa có"}`,
    `Từ loại: ${item.partOfSpeech || "chưa có"}`,
    `Bài: ${item.book} - Bài ${item.lesson} ${item.lessonTitle ? `(${item.lessonTitle})` : ""}`,
    `Ví dụ dữ liệu: ${item.exampleHan || "chưa có"} ${item.examplePinyin ? `| ${item.examplePinyin}` : ""} ${item.exampleVi ? `| ${item.exampleVi}` : ""}`,
    `Ghi chú dữ liệu: ${item.note || "không có"}`,
    feedback
      ? `Kết quả vừa học: người học gõ "${feedback.input || "(trống)"}"; đáp án mong đợi "${item.hanzi}"; trạng thái ${feedback.correct ? "đúng" : "sai"}; đáp án ${feedback.revealed ? "đã được hiện" : "chưa hiện"}.`
      : "Chưa có lượt chấm trong thẻ này.",
  ].join("\n");
}

function buildSystemPrompt() {
  return [
    "Bạn là Gia sư HSK của Hồng, chuyên luyện HSK4 theo giáo trình chuẩn 4A/4B cho người Việt.",
    "Mục tiêu là dạy thật chính xác, ngắn gọn, có chiều sâu như một gia sư tiếng Trung chuyên nghiệp; bám HSK4 hiện tại và xây nền đủ chắc để lên HSK cao cấp 7-9.",
    "Luôn ưu tiên tiếng Việt tự nhiên. Khi cần, dùng chữ Hán giản thể, pinyin có dấu hoặc pinyin rõ âm, và ví dụ ngắn ở mức HSK4.",
    "Bạn đang ở trong một sidebar chat của app học. Trả lời như một gia sư đang theo sát phiên học, nhớ các câu vừa trao đổi, nhưng không tự nhận có trí nhớ ngoài dữ liệu được cung cấp.",
    "Không bịa là nội dung chính thức của đề thi hay giáo trình. Nếu dữ liệu chưa đủ, nói rõ cần kiểm tra lại.",
    "Không chép dài bài khóa, đề thi, sách hoặc nội dung có bản quyền. Chỉ tạo ví dụ học tập mới, ngắn và sát từ hiện tại.",
    "Nếu người học nhập sai, phân tích khác biệt giữa đáp án mong đợi và phần người học đã gõ; tập trung vào chữ thiếu, chữ thừa, hoặc chữ dễ nhầm.",
    "Không hiển thị quá trình suy nghĩ nội bộ. Không mở đầu bằng 'Okay' hoặc tự mô tả việc bạn đang phân tích.",
    "Giữ phản hồi trong 4-8 câu hoặc 3-5 gạch đầu dòng. Không dùng emoji. Không lan man.",
  ].join("\n");
}

function buildUserPrompt(request) {
  const { item } = request;
  const actionInstruction = {
    explain: "Giải thích nghĩa, sắc thái dùng, cấu trúc/collocation quan trọng và lỗi thường gặp.",
    examples: "Tạo 3 ví dụ HSK4: mỗi ví dụ có chữ Hán, pinyin, nghĩa tiếng Việt; dùng từ trong ngữ cảnh tự nhiên.",
    why_wrong: "Sửa lỗi phần người học vừa gõ. So với đáp án chữ Hán, chỉ ra khác biệt và cách nhớ đúng.",
    memory_tip: "Tạo mẹo nhớ nghiêm túc, dựa vào nghĩa, cấu tạo chữ, âm hoặc ngữ cảnh, tránh đùa quá lố.",
    ask: "Trả lời câu hỏi riêng của người học, nhưng vẫn bám sát từ hiện tại và trình độ HSK4.",
  }[request.action];

  return [
    `Hành động cần làm: ${actionInstruction}`,
    `Từ cần tập trung: ${item.hanzi}`,
    request.question ? `Câu hỏi riêng của người học: ${request.question}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function providerError(status) {
  if (status === 401 || status === 403) {
    return new TutorRequestError("AI gateway chưa có quyền gọi NVIDIA. Kiểm tra secret NVIDIA_API_KEY.", status);
  }
  if (status === 429) {
    return new TutorRequestError("NVIDIA đang giới hạn lượt gọi. Chờ một chút rồi thử lại.", 429);
  }
  return new TutorRequestError("NVIDIA tạm thời chưa phản hồi ổn định.", 502, status >= 500);
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
}

function jsonError(error, status) {
  return jsonResponse({ error }, status);
}

class TutorRequestError extends Error {
  constructor(message, status, retryable = false) {
    super(message);
    this.status = status;
    this.retryable = retryable;
  }
}
