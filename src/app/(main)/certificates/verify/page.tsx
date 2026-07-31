"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Form tra cứu chứng chỉ — công khai, không cần đăng nhập.
 * Điều hướng sang /certificates/verify/[number] để kết quả có URL chia sẻ được.
 */
export default function VerifyCertificateFormPage() {
  const router = useRouter();
  const [number, setNumber] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = number.trim();
    if (!trimmed) return;
    router.push(`/certificates/verify/${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">
        Tra cứu chứng chỉ
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Nhập mã chứng chỉ để kiểm tra tính hợp lệ và xem thông tin người được
        cấp.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <input
          type="text"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Ví dụ: CERT-2026-0001"
          aria-label="Mã chứng chỉ"
          className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
        />
        <button
          type="submit"
          disabled={!number.trim()}
          className="rounded-md bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          Tra cứu
        </button>
      </form>
    </div>
  );
}
