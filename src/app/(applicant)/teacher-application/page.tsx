"use client";

import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  useCreateTeacherApplication,
  useMyTeacherApplication,
  useResubmitTeacherApplication,
} from "@/hooks/queries/use-teacher-application";
import { QueryState } from "@/components/common/query-state";
import { Button } from "@/components/ui/button";
import { ApplicationForm } from "@/components/teacher-application/application-form";
import { getRoleHomeRoute } from "@/lib/routes";
import { formatDate } from "@/lib/utils";
import type { MyTeacherApplication } from "@/types/approval";

export default function TeacherApplicationPage() {
  const { data, isLoading, isError, error, refetch } = useMyTeacherApplication();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hồ sơ ứng tuyển giảng viên</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Quản trị viên xem hồ sơ và cấp quyền giảng dạy. Bạn có thể tạo khoá học sau khi được duyệt.
        </p>
      </div>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
        {/* data === null: GET /teacher-profiles/me trả 404 — chưa từng nộp hồ sơ. */}
        {data === null && <CreateApplication />}
        {data && <ApplicationStatus application={data} />}
      </QueryState>
    </div>
  );
}

function CreateApplication() {
  const create = useCreateTeacherApplication();
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <h2 className="mb-4 text-base font-semibold">Nộp hồ sơ</h2>
      <ApplicationForm
        submitLabel="Nộp hồ sơ"
        submitTestId="application-submit"
        isPending={create.isPending}
        onSubmit={(input) => create.mutate(input)}
      />
    </section>
  );
}

function ApplicationStatus({ application }: { application: MyTeacherApplication }) {
  if (application.approval_status === "approved") {
    return (
      <Banner tone="success" icon={<CheckCircle2 className="h-5 w-5" />} testId="application-approved">
        <p className="font-semibold">Hồ sơ đã được duyệt</p>
        <p className="mt-1">Bạn đã là giảng viên của 40Study.</p>
        <Button asChild size="sm" className="mt-3">
          <Link href={getRoleHomeRoute("TEACHER")}>Vào khu giảng viên</Link>
        </Button>
      </Banner>
    );
  }

  if (application.approval_status === "pending") {
    return (
      <Banner tone="warning" icon={<Clock className="h-5 w-5" />} testId="application-pending">
        <p className="font-semibold">Hồ sơ đang chờ duyệt</p>
        <p className="mt-1">
          Nộp lúc {formatDate(application.updated_at)}. Trang tự cập nhật — khi được duyệt, bạn sẽ
          được chuyển sang khu giảng viên mà không cần đăng nhập lại.
        </p>
      </Banner>
    );
  }

  return <RejectedApplication application={application} />;
}

function RejectedApplication({ application }: { application: MyTeacherApplication }) {
  const resubmit = useResubmitTeacherApplication();
  const remaining = Math.max(0, application.max_resubmissions - application.resubmission_count);

  return (
    <div className="space-y-4">
      <Banner tone="danger" icon={<XCircle className="h-5 w-5" />} testId="application-rejected">
        <p className="font-semibold">Hồ sơ bị từ chối</p>
        <p className="mt-1 whitespace-pre-line" data-testid="application-rejection-reason">
          {application.rejection_reason || "Quản trị viên không ghi lý do."}
        </p>
      </Banner>

      {/* can_resubmit do backend tính (rejected && resubmission_count < max) — không tự tính lại. */}
      {application.can_resubmit ? (
        <section className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="text-base font-semibold">Sửa hồ sơ và nộp lại</h2>
          <p className="mb-4 mt-1 text-sm text-gray-500">Bạn còn {remaining} lần nộp lại.</p>
          <ApplicationForm
            initial={application}
            submitLabel="Nộp lại"
            submitTestId="application-resubmit"
            isPending={resubmit.isPending}
            onSubmit={(data) => resubmit.mutate({ profileId: application.id, data })}
          />
        </section>
      ) : (
        <p
          role="alert"
          data-testid="application-resubmit-limit"
          className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
        >
          Bạn đã nộp lại tối đa 3 lần. Vui lòng liên hệ bộ phận hỗ trợ để được xem xét.
        </p>
      )}
    </div>
  );
}

const TONE_CLASS = {
  success: "border-green-200 bg-green-50 text-green-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-800",
} as const;

function Banner({
  tone,
  icon,
  testId,
  children,
}: {
  tone: keyof typeof TONE_CLASS;
  icon: React.ReactNode;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      data-testid={testId}
      className={`flex gap-3 rounded-xl border p-4 text-sm ${TONE_CLASS[tone]}`}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>{children}</div>
    </div>
  );
}
