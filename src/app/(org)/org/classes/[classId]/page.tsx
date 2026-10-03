"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ClassAssignmentsList } from "@/components/classes/class-assignments-list";
import { ClassManagePanel } from "@/components/classes/class-manage-panel";

/**
 * Chi tiết lớp của tổ chức cho chủ/quản trị tổ chức: kích hoạt lớp, gán/gỡ giảng viên, ghi danh học viên,
 * và danh sách bài tập của lớp (mỗi bài dẫn tới trang chấm).
 * Lớp của tổ chức khác hoặc lớp cá nhân: backend trả 404 nên panel hiện "Không tìm thấy lớp".
 */
export default function OrgClassDetailPage() {
  const params = useParams();
  const classId = String(params.classId ?? "");

  return (
    <div className="space-y-6">
      <Link href="/org/classes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Danh sách lớp
      </Link>
      <ClassManagePanel classId={classId} />
      <ClassAssignmentsList classId={classId} hrefFor={(id) => `/org/classes/${classId}/assignments/${id}`} />
    </div>
  );
}
