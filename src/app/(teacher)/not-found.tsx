import type { Metadata } from "next";
import { ResourceUnavailable } from "@/components/common/resource-unavailable";

export const metadata: Metadata = { title: "Không tìm thấy trang" };

/**
 * Q7-T09: `/teacher/<không tồn tại>` từng rơi vào 404 toàn cục, không có thanh bên giảng viên và chỉ có nút "Về trang
 * chủ". Cùng trạng thái "Không tìm thấy" mà khoá/lớp/học viên/cuộc thi đã hiện trong khung giảng viên.
 */
export default function TeacherNotFound() {
  return <ResourceUnavailable resourceLabel="trang" backHref="/teacher" backLabel="Về trang giảng viên" />;
}
