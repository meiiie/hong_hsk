import type { AiTutorClient, AiTutorRequest, AiTutorResponse } from "../../application/ports/ai-tutor-client";

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
  };
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
