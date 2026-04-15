import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { certificateService, IssueCertificateDTO } from "@/services/certificate.service";

// ─── Query keys ────────────────────────────────────────────────────────────

export const certificateKeys = {
  all: ["certificates"] as const,
  list: () => [...certificateKeys.all, "list"] as const,
  detail: (id: string) => [...certificateKeys.all, "detail", id] as const,
  verify: (number: string) => [...certificateKeys.all, "verify", number] as const,
};

// ─── Queries ───────────────────────────────────────────────────────────────

export function useMyCertificates(params?: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: [...certificateKeys.list(), params],
    queryFn: () => certificateService.list(params),
  });
}

export function useCertificate(id: string) {
  return useQuery({
    queryKey: certificateKeys.detail(id),
    queryFn: () => certificateService.getById(id),
    enabled: !!id,
  });
}

export function useVerifyCertificate(certificateNumber: string) {
  return useQuery({
    queryKey: certificateKeys.verify(certificateNumber),
    queryFn: () => certificateService.verify(certificateNumber),
    enabled: !!certificateNumber,
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────

export function useIssueCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IssueCertificateDTO) => certificateService.issue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.list() });
      toast.success("Đã cấp chứng chỉ thành công");
    },
    onError: () => {
      toast.error("Không thể cấp chứng chỉ");
    },
  });
}
