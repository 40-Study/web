"use client";

/** /teacher/contests/create — tạo cuộc thi (DRAFT) rồi chuyển tới trang chi tiết để gửi duyệt. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ContestForm } from "@/components/contest-manage/contest-form";
import { useCreateContest } from "@/hooks/queries/use-contest-manage";
import { emptyContestForm } from "@/lib/contest-manage/form";

export default function CreateContestPage() {
  const router = useRouter();
  const create = useCreateContest();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/teacher/contests" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Cuộc thi của tôi
      </Link>
      <h1 className="text-2xl font-bold">Tạo cuộc thi</h1>
      <ContestForm
        initialValues={emptyContestForm()}
        submitLabel="Lưu bản nháp"
        isPending={create.isPending}
        onSubmit={(body) =>
          create.mutate(body, { onSuccess: (contest) => router.push(`/teacher/contests/${contest.id}`) })
        }
      />
    </div>
  );
}
