import { api } from "@/lib/api-client";
import { ApiError } from "@/lib/errors";
import {
  artifactSchema,
  type OutputKind,
  type SourceDocument,
  type TeachingArtifact,
} from "@/lib/open-design/project";
export interface DesignStatus {
  configured: boolean;
  provider: string;
}
export interface DesignInput {
  skills?: { name: string; instructions: string }[];
  history?: { role: "user" | "assistant"; content: string }[];
  request_id: string;
  output: OutputKind;
  prompt: string;
  count: number;
  documents: Pick<SourceDocument, "name" | "text">[];
  current?: TeachingArtifact;
}
export const openDesignService = {
  status: (signal?: AbortSignal) =>
    api.get<{ data: DesignStatus }>("/open-design/status", { signal }).then((r) => r.data.data),
  document: async (file: File, signal: AbortSignal) => {
    const form = new FormData();
    form.append("file", file);
    const response = await api.post<{ data: { name: string; text: string } }>(
      "/open-design/documents",
      form,
      { signal, timeout: 30000, headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data.data;
  },
  generate: async (input: DesignInput, signal: AbortSignal) => {
    try {
      const response = await api.post<{ data: { message: string; artifact: unknown } }>(
        "/open-design/generate",
        input,
        { signal, timeout: 100000 }
      );
      return {
        message: response.data.data.message,
        artifact: artifactSchema.parse(response.data.data.artifact),
      };
    } catch (error) {
      if (error instanceof ApiError && error.status >= 500) {
        throw new Error(
          error.status === 504
            ? "AI phản hồi quá lâu. Hãy giảm số lượng và thử lại; bản nháp trước vẫn được giữ."
            : error.status === 503
              ? "AI chưa sẵn sàng. Kiểm tra cấu hình Viettel AI và backend rồi thử lại."
              : "Viettel AI chưa trả về kết quả hợp lệ. Kiểm tra endpoint, model và API key rồi thử lại; bản nháp trước vẫn được giữ."
        );
      }
      throw error;
    }
  },
  cancel: (requestID: string) =>
    api
      .post<{ data: { cancelled: boolean } }>("/open-design/cancel", { request_id: requestID })
      .then((r) => r.data.data),
};
