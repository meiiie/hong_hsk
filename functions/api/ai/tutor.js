const DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";
const MAX_BODY_BYTES = 12_000;
const MAX_QUESTION_CHARS = 400;
const MAX_OUTPUT_TOKENS = 700;
const REQUEST_TIMEOUT_MS = 25_000;

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
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
    const baseUrl = cleanText(context.env.NVIDIA_BASE_URL) || DEFAULT_BASE_URL;
    const providerResponse = await callNemotron({
      apiKey,
      baseUrl,
      model,
      request,
    });

    return jsonResponse({
      content: providerResponse,
      model,
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
    item,
    learner: sanitizeLearner(payload.learner),
    feedback: sanitizeFeedback(payload.feedback),
  };
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

function cleanText(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(/\s+/g, " ").trim().slice(0, 1_200);
}

async function callNemotron({ apiKey, baseUrl, model, request }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(),
          },
          {
            role: "user",
            content: buildUserPrompt(request),
          },
        ],
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
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new TutorRequestError("AI trả về phản hồi rỗng.", 502);
    }

    return content.trim();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new TutorRequestError("AI xử lý quá lâu. Thử lại với câu hỏi ngắn hơn.", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildSystemPrompt() {
  return [
    "Bạn là Gia sư HSK của Hồng, chuyên luyện HSK4 theo giáo trình chuẩn 4A/4B cho người Việt.",
    "Mục tiêu là dạy thật chính xác, ngắn gọn, có chiều sâu như một gia sư tiếng Trung chuyên nghiệp; bám HSK4 hiện tại và xây nền đủ chắc để lên HSK cao cấp 7-9.",
    "Luôn ưu tiên tiếng Việt tự nhiên. Khi cần, dùng chữ Hán giản thể, pinyin có dấu hoặc pinyin rõ âm, và ví dụ ngắn ở mức HSK4.",
    "Không bịa là nội dung chính thức của đề thi hay giáo trình. Nếu dữ liệu chưa đủ, nói rõ cần kiểm tra lại.",
    "Không chép dài bài khóa, đề thi, sách hoặc nội dung có bản quyền. Chỉ tạo ví dụ học tập mới, ngắn và sát từ hiện tại.",
    "Nếu người học nhập sai, phân tích khác biệt giữa đáp án mong đợi và phần người học đã gõ; tập trung vào chữ thiếu, chữ thừa, hoặc chữ dễ nhầm.",
    "Giữ phản hồi trong 4-8 câu hoặc 3-5 gạch đầu dòng. Không dùng emoji. Không lan man.",
  ].join("\n");
}

function buildUserPrompt(request) {
  const { item, learner, feedback } = request;
  const actionInstruction = {
    explain: "Giải thích nghĩa, sắc thái dùng, cấu trúc/collocation quan trọng và lỗi thường gặp.",
    examples: "Tạo 3 ví dụ HSK4: mỗi ví dụ có chữ Hán, pinyin, nghĩa tiếng Việt; dùng từ trong ngữ cảnh tự nhiên.",
    why_wrong: "Sửa lỗi phần người học vừa gõ. So với đáp án chữ Hán, chỉ ra khác biệt và cách nhớ đúng.",
    memory_tip: "Tạo mẹo nhớ nghiêm túc, dựa vào nghĩa, cấu tạo chữ, âm hoặc ngữ cảnh, tránh đùa quá lố.",
    ask: "Trả lời câu hỏi riêng của người học, nhưng vẫn bám sát từ hiện tại và trình độ HSK4.",
  }[request.action];

  return [
    `Hành động cần làm: ${actionInstruction}`,
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
  return new TutorRequestError("NVIDIA tạm thời chưa phản hồi ổn định.", 502);
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
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
