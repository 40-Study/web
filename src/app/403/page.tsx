import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-6xl font-bold text-gray-300">403</h1>
      <h2 className="mt-4 text-xl font-semibold text-gray-800">
        Không có quyền truy cập
      </h2>
      <p className="mt-2 text-gray-500">
        Bạn không có quyền truy cập trang này.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-primary-600 px-6 py-2 text-white hover:bg-primary-700"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
