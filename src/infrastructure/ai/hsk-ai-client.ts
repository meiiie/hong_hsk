import type {
  AiTutorClient,
  AiTutorRequest,
  AiTutorResponse,
  AiTutorStreamHandlers,
} from "../../application/ports/ai-tutor-client";

const DEFAULT_AI_ENDPOINT = "/api/ai/tutor";

export function createHskAiClient(endpoint = DEFAULT_AI_ENDPOINT): AiTutorClient {
  return {
    async ask(request: AiTutorRequest): Promise<AiTutorResponse> {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const payload = (await readJson(response)) as Partial<AiTutorResponse> & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || aiStatusError(response.status));
      }

      if (!isTutorResponse(payload)) {
        throw new Error("Phản hồi AI chưa đúng định dạng.");
      }

      return payload;
    },
    async stream(
      request: AiTutorRequest,
      handlers: AiTutorStreamHandlers,
      signal?: AbortSignal,
    ): Promise<AiTutorResponse> {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ ...request, stream: true }),
        signal,
      });

      if (!response.ok || !response.body) {
        const payload = (await readJson(response)) as { error?: string };
        throw new Error(payload.error || aiStatusError(response.status));
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream")) {
        const payload = (await readJson(response)) as Partial<AiTutorResponse> & { error?: string };
        if (!isTutorResponse(payload)) {
          throw new Error(payload.error || "Phản hồi AI chưa đúng định dạng.");
        }
        return payload;
      }

      return parseTutorStream(response.body, request, handlers, signal);
    },
  };
}

async function parseTutorStream(
  stream: ReadableStream<Uint8Array>,
  request: AiTutorRequest,
  handlers: AiTutorStreamHandlers,
  signal?: AbortSignal,
): Promise<AiTutorResponse> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let content = "";
  let model = "";
  let generatedAt = "";
  let sessionId = request.sessionId;
  let streamError = "";

  const dispatchBuffered = (flushTail = false) => {
    buffer = normalizeSseChunk(buffer);
    while (true) {
      const separatorIndex = buffer.indexOf("\n\n");
      if (separatorIndex === -1) {
        break;
      }
      const eventText = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      dispatchTutorEvent(eventText);
    }
    if (flushTail && buffer.trim()) {
      dispatchTutorEvent(buffer);
      buffer = "";
    }
  };

  const dispatchTutorEvent = (eventText: string) => {
    const event = parseSseEvent(eventText);
    if (!event) {
      return;
    }
    if (event.type === "status") {
      handlers.onStatus?.(String(event.data.message ?? ""));
      return;
    }
    if (event.type === "answer_delta") {
      const delta = String(event.data.content ?? "");
      content += delta;
      handlers.onDelta?.(delta);
      return;
    }
    if (event.type === "metadata") {
      model = String(event.data.model ?? model);
      generatedAt = String(event.data.generatedAt ?? generatedAt);
      sessionId = String(event.data.sessionId ?? sessionId ?? "");
      handlers.onMetadata?.({ model, generatedAt, sessionId });
      return;
    }
    if (event.type === "error") {
      streamError = String(event.data.error ?? "AI tạm thời chưa phản hồi.");
      handlers.onError?.(streamError);
    }
  };

  try {
    while (true) {
      if (signal?.aborted) {
        throw new Error("Đã dừng gia sư AI.");
      }
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += normalizeSseChunk(decoder.decode(value, { stream: true }));
      dispatchBuffered();
    }
  } finally {
    buffer += normalizeSseChunk(decoder.decode());
    dispatchBuffered(true);
    reader.releaseLock();
  }

  if (streamError) {
    throw new Error(streamError);
  }
  if (!content.trim()) {
    throw new Error("AI trả về phản hồi rỗng.");
  }

  return {
    action: request.action,
    content: content.trim(),
    model: model || "NVIDIA",
    generatedAt: generatedAt || new Date().toISOString(),
    sessionId,
  };
}

function normalizeSseChunk(chunk: string): string {
  return chunk.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function parseSseEvent(eventText: string): { type: string; data: Record<string, unknown> } | undefined {
  const lines = eventText.trim().split("\n");
  if (!lines.length || lines.every((line) => line.trim().startsWith(":"))) {
    return undefined;
  }

  let type = "";
  const dataLines: string[] = [];

  lines.forEach((line) => {
    if (line.startsWith("event: ")) {
      type = line.slice(7).trim();
    } else if (line.startsWith("data: ")) {
      dataLines.push(line.slice(6));
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5));
    }
  });

  if (!type || !dataLines.length) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(dataLines.join("\n"));
    return {
      type,
      data: parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {},
    };
  } catch {
    return undefined;
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function isTutorResponse(value: Partial<AiTutorResponse>): value is AiTutorResponse {
  return (
    typeof value.content === "string" &&
    typeof value.model === "string" &&
    typeof value.action === "string" &&
    typeof value.generatedAt === "string"
  );
}

function aiStatusError(status: number): string {
  if (status === 404) {
    return "AI gateway chưa được bật ở môi trường này. Dùng Cloudflare Pages Functions hoặc cấu hình production secret.";
  }
  if (status === 401 || status === 403) {
    return "AI gateway chưa có quyền gọi NVIDIA. Kiểm tra secret NVIDIA_API_KEY.";
  }
  if (status === 429) {
    return "AI đang bị giới hạn lượt gọi. Chờ một chút rồi thử lại.";
  }
  return "AI tạm thời chưa phản hồi. Thử lại sau vài giây.";
}
