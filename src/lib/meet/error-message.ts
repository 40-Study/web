import { translateApiErrorMessage } from "@/lib/error-messages";
import { MeetApiError } from "./api";

/**
 * Câu hiển thị cho lỗi của client phòng live. Lớp lưu trữ (409 CLASS_ARCHIVED) hiện message tiếng Việt của backend
 * (MeetApiError để message của envelope ở `.code`, còn `.message` chỉ là "HTTP 409"); lỗi khác giữ hành vi cũ.
 */
export function meetErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof MeetApiError && err.bodyCode === "CLASS_ARCHIVED") {
    return translateApiErrorMessage(err.status, err.bodyCode, err.code);
  }
  return (err as Error | undefined)?.message ?? fallback;
}
