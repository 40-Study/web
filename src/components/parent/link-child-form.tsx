"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parentLinkErrorMessage, useCreateLinkRequest } from "@/hooks/queries/use-parent-link";
import type { LinkRelationship } from "@/services/parent-link.service";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RELATIONSHIP_OPTIONS: { value: LinkRelationship; label: string }[] = [
  { value: "parent", label: "Bố/Mẹ" },
  { value: "guardian", label: "Người giám hộ" },
  { value: "grandparent", label: "Ông/Bà" },
];

/**
 * Phụ huynh tự gửi yêu cầu liên kết tới email tài khoản học sinh của con (Q4). Con phải đăng nhập
 * và xác nhận thì liên kết mới có hiệu lực — form nói rõ điều đó để phụ huynh không tưởng đã xong.
 */
export function LinkChildForm() {
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState<LinkRelationship>("parent");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = useCreateLinkRequest();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Vui lòng nhập đúng email tài khoản học sinh của con.");
      return;
    }
    setError(null);
    create.mutate(
      { student_email: trimmed, relationship, message: message.trim() || undefined },
      {
        onSuccess: () => {
          setEmail("");
          setMessage("");
        },
        onError: (err) => setError(parentLinkErrorMessage(err, "Không gửi được yêu cầu, vui lòng thử lại.")),
      }
    );
  };

  return (
    <form onSubmit={submit} noValidate className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Liên kết thêm con</h2>
        <p className="text-sm text-slate-500 mt-1">
          Nhập email tài khoản học sinh của con. Con cần đăng nhập và xác nhận thì bạn mới xem được tiến độ học tập.
        </p>
      </div>
      <div className="grid sm:grid-cols-[1fr_180px] gap-3">
        <div>
          <label htmlFor="link-child-email" className="block text-sm font-medium text-slate-700 mb-1">
            Email của con
          </label>
          <Input
            id="link-child-email"
            type="email"
            autoComplete="off"
            placeholder="vd: con@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? "link-child-error" : undefined}
          />
        </div>
        <div>
          <label htmlFor="link-child-relationship" className="block text-sm font-medium text-slate-700 mb-1">
            Bạn là
          </label>
          <select
            id="link-child-relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value as LinkRelationship)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            {RELATIONSHIP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="link-child-message" className="block text-sm font-medium text-slate-700 mb-1">
          Lời nhắn cho con (không bắt buộc)
        </label>
        <Textarea
          id="link-child-message"
          rows={2}
          maxLength={500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      {error && (
        <p id="link-child-error" role="alert" className="text-sm text-red-600">{error}</p>
      )}
      <Button type="submit" isLoading={create.isPending} loadingText="Đang gửi...">
        <UserPlus className="w-4 h-4 mr-2" />
        Gửi yêu cầu liên kết
      </Button>
    </form>
  );
}
