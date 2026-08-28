import type {
  NekoTutor,
  NekoTutorCancelResponse,
  NekoTutorRequest,
  NekoTutorResponse,
} from "../../application/ports/neko-tutor";

export class HttpNekoTutor implements NekoTutor {
  async ask(request: NekoTutorRequest, onBlock?: (block: string) => void): Promise<NekoTutorResponse> {
    const response = await fetch("/api/neko/tutor", {
      method: "POST",
      headers: {
        Accept: "application/x-ndjson, application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (response.ok && response.headers.get("Content-Type")?.includes("application/x-ndjson")) {
      return readNekoStream(response, onBlock);
    }
    const payload = await readPayload(response);

    if (!response.ok) {
      throw new Error(readText(payload, "error") || "Neko chưa trả lời được. Hãy thử lại.");
    }

    const answer = readText(payload, "answer");
    const conversationId = readText(payload, "conversationId");
    if (!answer || !conversationId) {
      throw new Error("Phản hồi từ Neko không đúng định dạng.");
    }
    return { answer, conversationId };
  }

  async cancel(requestId: string): Promise<NekoTutorCancelResponse> {
    const payload = await postJson("/api/neko/cancel", { requestId });
    const conversationId = readText(payload, "conversationId");
    return conversationId ? { conversationId } : {};
  }

  async closeSession(conversationId: string): Promise<void> {
    await postJson("/api/neko/session/close", { conversationId });
  }
}

async function readNekoStream(
  response: Response,
  onBlock?: (block: string) => void,
): Promise<NekoTutorResponse> {
  if (!response.body) {
    throw new Error("Phản hồi từ Neko không có nội dung.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffered = "";
  let result: NekoTutorResponse | undefined;

  const readFrame = (line: string): void => {
    if (!line.trim()) {
      return;
    }
    let frame: unknown;
    try {
      frame = JSON.parse(line);
    } catch {
      throw new Error("Phản hồi stream từ Neko không đúng định dạng.");
    }
    if (!frame || typeof frame !== "object" || Array.isArray(frame)) {
      throw new Error("Phản hồi stream từ Neko không đúng định dạng.");
    }
    const record = frame as Record<string, unknown>;
    if (record.type === "delta") {
      if (typeof record.text !== "string") {
        throw new Error("Khối trả lời từ Neko không đúng định dạng.");
      }
      if (record.text) {
        onBlock?.(record.text);
      }
      return;
    }
    if (record.type === "done") {
      const answer = readText(frame, "answer");
      const conversationId = readText(frame, "conversationId");
      if (!answer || !conversationId) {
        throw new Error("Phản hồi từ Neko không đúng định dạng.");
      }
      result = { answer, conversationId };
      return;
    }
    if (record.type === "error") {
      throw new Error(readText(frame, "error") || "Neko chưa trả lời được. Hãy thử lại.");
    }
    throw new Error("Phản hồi stream từ Neko không đúng định dạng.");
  };

  while (true) {
    const { done, value } = await reader.read();
    buffered += decoder.decode(value, { stream: !done });
    let newline = buffered.indexOf("\n");
    while (newline >= 0) {
      readFrame(buffered.slice(0, newline));
      buffered = buffered.slice(newline + 1);
      newline = buffered.indexOf("\n");
    }
    if (done) {
      break;
    }
  }
  readFrame(buffered);
  if (!result) {
    throw new Error("Neko đã ngắt stream trước khi hoàn tất câu trả lời.");
  }
  return result;
}

async function postJson(url: string, body: unknown): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(readText(payload, "error") || "Không điều khiển được phiên Neko.");
  }
  return payload;
}

async function readPayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function readText(payload: unknown, key: string): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "";
  }
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}
