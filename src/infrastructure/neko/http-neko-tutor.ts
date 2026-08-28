import type {
  NekoTutor,
  NekoTutorCancelResponse,
  NekoTutorRequest,
  NekoTutorResponse,
} from "../../application/ports/neko-tutor";

export class HttpNekoTutor implements NekoTutor {
  async ask(request: NekoTutorRequest): Promise<NekoTutorResponse> {
    const response = await fetch("/api/neko/tutor", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
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
