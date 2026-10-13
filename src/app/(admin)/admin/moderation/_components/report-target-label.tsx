import Link from "next/link";
import type { Report } from "@/services/report.service";
import { getReportTargetLink } from "../_lib/report-actions";

const NO_TITLE_LABEL: Record<string, string> = {
  review: "Đánh giá không có nội dung",
};

/**
 * Tên đối tượng bị báo cáo (kèm link mở đối tượng khi có). Báo cáo không có `target` (backend cũ) rơi về
 * UUID thô; đối tượng đã bị xoá hiện thông báo rõ, không link.
 */
export function ReportTargetLabel({ report }: { report: Report }) {
  const target = report.target;
  if (!target) {
    return <span className="break-all font-mono text-[11px] text-gray-400">{report.reported_id}</span>;
  }
  if (!target.exists) {
    return <span className="text-xs italic text-gray-500">Đối tượng đã bị xoá</span>;
  }

  const name = target.name || NO_TITLE_LABEL[target.type] || "Không có tiêu đề";
  const link = getReportTargetLink(report);
  if (!link) return <span className="text-xs text-gray-600 dark:text-gray-300">{name}</span>;
  return (
    <Link
      href={link.href}
      className="text-primary-700 hover:underline dark:text-primary-400"
      {...(link.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {name}
    </Link>
  );
}
