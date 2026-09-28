import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { parentLinkService, type CreateLinkRequestDTO } from "@/services/parent-link.service";
import { authKeys } from "@/hooks/queries/use-auth";
import { parentDashboardKeys } from "@/hooks/queries/use-parent-dashboard";
import { ApiError, RateLimitError } from "@/lib/errors";

export const parentLinkKeys = {
  all: ["parent-link"] as const,
  sent: () => [...parentLinkKeys.all, "sent"] as const,
  incoming: () => [...parentLinkKeys.all, "incoming"] as const,
  parents: () => [...parentLinkKeys.all, "parents"] as const,
};

/**
 * Thông điệp lỗi hiển thị cho người dùng. Backend trả `message` tiếng Việt (envelope
 * {"message","code"}); riêng 429 thì api-client hiện bỏ body và thay bằng câu tiếng Anh chung,
 * nên dịch tại đây theo đúng luật nghiệp vụ của luồng này (giới hạn số yêu cầu mỗi ngày).
 */
export function parentLinkErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof RateLimitError) {
    return "Bạn đã gửi quá nhiều yêu cầu liên kết trong 24 giờ. Vui lòng thử lại sau.";
  }
  if (error instanceof ApiError && error.status < 500 && error.message) return error.message;
  return fallback;
}

export function useSentLinkRequests(enabled = true) {
  return useQuery({ queryKey: parentLinkKeys.sent(), queryFn: parentLinkService.listSent, enabled });
}

export function useIncomingLinkRequests(enabled = true) {
  return useQuery({ queryKey: parentLinkKeys.incoming(), queryFn: parentLinkService.listIncoming, enabled });
}

export function useLinkedParents(enabled = true) {
  return useQuery({ queryKey: parentLinkKeys.parents(), queryFn: parentLinkService.listLinkedParents, enabled });
}

export function useCreateLinkRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateLinkRequestDTO) => parentLinkService.create(body),
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu liên kết. Con cần đăng nhập và xác nhận.");
      qc.invalidateQueries({ queryKey: parentLinkKeys.sent() });
    },
    // Lỗi hiển thị ngay trong form (xem LinkChildForm) nên không toast thêm ở đây.
  });
}

export function useCancelLinkRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => parentLinkService.cancel(requestId),
    onSuccess: () => {
      toast.success("Đã huỷ yêu cầu liên kết.");
      qc.invalidateQueries({ queryKey: parentLinkKeys.sent() });
    },
    onError: (e) => toast.error(parentLinkErrorMessage(e, "Không huỷ được yêu cầu, vui lòng thử lại.")),
  });
}

export function useRespondLinkRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: "accept" | "reject" }) =>
      parentLinkService.respond(requestId, action),
    onSuccess: (_data, { action }) => {
      toast.success(action === "accept" ? "Đã xác nhận liên kết với phụ huynh." : "Đã từ chối yêu cầu liên kết.");
      qc.invalidateQueries({ queryKey: parentLinkKeys.incoming() });
      qc.invalidateQueries({ queryKey: parentLinkKeys.parents() });
    },
    onError: (e) => toast.error(parentLinkErrorMessage(e, "Không xử lý được yêu cầu, vui lòng thử lại.")),
  });
}

export function useUnlinkChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (childId: string) => parentLinkService.unlinkChild(childId),
    onSuccess: () => {
      toast.success("Đã huỷ liên kết với con.");
      qc.invalidateQueries({ queryKey: authKeys.children() });
      // Bỏ cache dữ liệu con: sau khi huỷ, backend đã từ chối mọi API xem dữ liệu con.
      qc.removeQueries({ queryKey: parentDashboardKeys.all });
      qc.invalidateQueries({ queryKey: parentLinkKeys.sent() });
    },
    onError: (e) => toast.error(parentLinkErrorMessage(e, "Không huỷ được liên kết, vui lòng thử lại.")),
  });
}

export function useUnlinkParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (parentId: string) => parentLinkService.unlinkParent(parentId),
    onSuccess: () => {
      toast.success("Đã huỷ liên kết với phụ huynh.");
      qc.invalidateQueries({ queryKey: parentLinkKeys.parents() });
    },
    onError: (e) => toast.error(parentLinkErrorMessage(e, "Không huỷ được liên kết, vui lòng thử lại.")),
  });
}
