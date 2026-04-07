"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { AUTH_ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/stores/auth.store";
import { useValidateInvitationToken, useRespondInvitation } from "@/hooks/queries/use-invitation";

const relationshipLabels: Record<string, string> = {
  parent: "Phụ huynh",
  guardian: "Người giám hộ",
  grandparent: "Ông/Bà",
};

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { isAuthenticated } = useAuthStore();
  const respondMutation = useRespondInvitation();

  const { data, isLoading, isError } = useValidateInvitationToken(token);

  // Không có token
  if (!token) {
    return (
      <AuthCard>
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Liên kết không hợp lệ</h2>
          <p className="mb-6 text-sm text-gray-500">
            Không tìm thấy mã lời mời. Vui lòng kiểm tra lại liên kết trong email.
          </p>
          <Button onClick={() => router.push("/")} className="h-12 w-full">
            Về trang chủ
          </Button>
        </div>
      </AuthCard>
    );
  }

  // Đang loading
  if (isLoading) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-gray-500">Đang xác thực lời mời...</p>
        </div>
      </AuthCard>
    );
  }

  // Lỗi hoặc token không hợp lệ
  if (isError || !data?.valid) {
    return (
      <AuthCard>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Lời mời không hợp lệ</h2>
          <p className="mb-6 text-sm text-gray-500">
            Lời mời đã hết hạn, đã được sử dụng, hoặc không tồn tại.
          </p>
          <Button onClick={() => router.push("/")} className="h-12 w-full">
            Về trang chủ
          </Button>
        </div>
      </AuthCard>
    );
  }

  // Token hợp lệ nhưng chưa đăng nhập → redirect sang login/register
  if (!isAuthenticated) {
    const redirectPath = `${AUTH_ROUTES.ACCEPT_INVITATION}?token=${token}`;

    return (
      <AuthCard>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Lời mời từ {data.student_name}</h2>
          <p className="mb-1 text-sm text-gray-500">
            Bạn được mời làm{" "}
            <span className="font-medium text-gray-700">
              {relationshipLabels[data.relationship ?? ""] ?? data.relationship}
            </span>
          </p>
          <p className="mb-6 text-sm text-gray-500">
            Vui lòng đăng nhập hoặc tạo tài khoản để tiếp tục.
          </p>

          <div className="space-y-3">
            {data.has_account ? (
              <Button
                onClick={() =>
                  router.push(`${AUTH_ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectPath)}`)
                }
                className="h-12 w-full"
              >
                Đăng nhập
              </Button>
            ) : (
              <>
                <Button
                  onClick={() =>
                    router.push(
                      `${AUTH_ROUTES.REGISTER}?redirect=${encodeURIComponent(redirectPath)}&email=${encodeURIComponent(data.email ?? "")}`
                    )
                  }
                  className="h-12 w-full"
                >
                  Tạo tài khoản mới
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`${AUTH_ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectPath)}`)
                  }
                  className="h-12 w-full"
                >
                  Đã có tài khoản? Đăng nhập
                </Button>
              </>
            )}
          </div>
        </div>
      </AuthCard>
    );
  }

  // Đã đăng nhập + token hợp lệ → hiện accept/reject
  const handleRespond = (action: "accept" | "reject") => {
    if (!data.invitation_id) return;
    respondMutation.mutate(
      { invitationId: data.invitation_id, action },
      {
        onSuccess: () => {
          router.push("/home");
        },
      }
    );
  };

  return (
    <AuthCard>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
          <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Lời mời phụ huynh</h2>
        <p className="mb-1 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{data.student_name}</span> đã mời bạn làm
        </p>
        <p className="mb-6 text-lg font-medium text-primary-600">
          {relationshipLabels[data.relationship ?? ""] ?? data.relationship}
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => handleRespond("accept")}
            disabled={respondMutation.isPending}
            className="h-12 w-full"
          >
            {respondMutation.isPending ? "Đang xử lý..." : "Chấp nhận lời mời"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRespond("reject")}
            disabled={respondMutation.isPending}
            className="h-12 w-full text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            Từ chối
          </Button>
        </div>
      </div>
    </AuthCard>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <AuthCard>
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="text-sm text-gray-500">Đang tải...</p>
          </div>
        </AuthCard>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
