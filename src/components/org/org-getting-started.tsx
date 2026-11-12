import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrgGettingStartedProps {
  /** Số thành viên (kể cả chủ tổ chức). */
  memberCount: number;
  classCount: number;
}

/**
 * Hướng dẫn bước tiếp theo khi tổ chức còn trống (QA-C-18): trước đây 4 thẻ số đều bằng 0 mà không nói phải làm gì.
 * Ẩn khi tổ chức đã có cả thành viên khác chủ và lớp học.
 */
export function OrgGettingStarted({ memberCount, classCount }: OrgGettingStartedProps) {
  const hasMembers = memberCount > 1;
  const hasClasses = classCount > 0;
  if (hasMembers && hasClasses) return null;

  const steps = [
    {
      done: hasMembers,
      title: "Thêm giảng viên và học viên",
      body: "Vào mục Thành viên, tìm người đã có tài khoản và chọn vai trò trong tổ chức.",
      href: "/org/members",
      cta: "Mở Thành viên",
    },
    {
      done: hasClasses,
      title: "Tạo lớp học cho tổ chức",
      body: "Giảng viên của tổ chức tạo lớp ở khu Giảng viên và chọn tổ chức này. Lớp sẽ hiện ở mục Lớp học.",
      href: "/org/classes",
      cta: "Mở Lớp học",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Bắt đầu với tổ chức</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {steps.map((s) => (
            <li key={s.title} className="flex gap-3">
              {s.done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" aria-label="Đã xong" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-label="Chưa làm" />
              )}
              <div className="min-w-0">
                <p className="font-medium text-foreground">{s.title}</p>
                <p className="text-sm text-muted-foreground">{s.body}</p>
                {!s.done && (
                  <Link href={s.href} className="mt-1 inline-block text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
                    {s.cta}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
