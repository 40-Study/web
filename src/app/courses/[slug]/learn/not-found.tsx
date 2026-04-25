import Link from "next/link";

export default function CourseNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Không tìm thấy khóa học
        </h1>
        <p className="text-gray-500 mb-6">
          Khóa học này không tồn tại hoặc bạn không có quyền truy cập.
        </p>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách khóa học
        </Link>
      </div>
    </div>
  );
}
