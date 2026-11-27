"use client";

import { useState } from "react";
import { Mail, Users, Heart, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useInviteParent, useSentInvitations, invitationKeys } from "@/hooks/queries/use-invitation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, INVITATION_DAILY_LIMIT_CODE } from "@/lib/errors";
import { getErrorMessage } from "@/lib/error-messages";

interface InviteParentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Relationship = "parent" | "guardian" | "grandparent";

const relationships: { value: Relationship; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: "parent",
    label: "Phụ huynh",
    icon: <Users className="w-5 h-5" />,
    description: "Bố hoặc mẹ",
  },
  {
    value: "guardian",
    label: "Người giám hộ",
    icon: <Users className="w-5 h-5" />,
    description: "Người chịu trách nhiệm pháp lý",
  },
  {
    value: "grandparent",
    label: "Ông/Bà",
    icon: <Heart className="w-5 h-5" />,
    description: "Ông nội, bà nội, ông ngoại, bà ngoại",
  },
];

type Step = "form" | "sending" | "success" | "error";

/**
 * Q10-STU-04 / #148 M1: lỗi mà gửi lại cùng yêu cầu chắc chắn lại thất bại, nên không hiện "Thử lại": hết hạn mức trong
 * ngày (backend trả 429 + code `ERR_INVITATION_DAILY_LIMIT`), tính năng đang tắt (403 ERR_FEATURE_DISABLED), mọi 429.
 *
 * Fallback có tài liệu cho BACKEND CŨ (chưa có code ổn định, trả 400 + câu "giới hạn ... trong ngày"): chỉ khi 400 KHÔNG
 * mang code `ERR_*` nào thì mới khớp câu chữ. Có code thì quyết định theo code, không bao giờ theo chữ.
 */
function isTerminalInviteError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.code === INVITATION_DAILY_LIMIT_CODE) return true;
  if (error.status === 403 || error.status === 429) return true;
  return error.status === 400 && !/^ERR_/.test(error.code) && /giới hạn/i.test(error.message);
}

export function InviteParentModal({ isOpen, onClose }: InviteParentModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("parent");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [canRetry, setCanRetry] = useState(true);

  const queryClient = useQueryClient();
  const inviteMutation = useInviteParent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email không hợp lệ");
      return;
    }

    setStep("sending");

    try {
      await inviteMutation.mutateAsync({
        email: email.trim(),
        relationship,
        message: message.trim() || undefined,
      });

      queryClient.invalidateQueries({ queryKey: invitationKeys.sent() });
      setStep("success");
    } catch (error: unknown) {
      setStep("error");
      // Q10-STU-04: http layer ném `ApiError` (không phải lỗi axios), nên đọc `response.data.message` luôn rơi về câu chung.
      setErrorMessage(getErrorMessage(error, "Có lỗi xảy ra khi gửi lời mời"));
      setCanRetry(!isTerminalInviteError(error));
    }
  };

  const handleClose = () => {
    setStep("form");
    setEmail("");
    setRelationship("parent");
    setMessage("");
    setErrorMessage("");
    setCanRetry(true);
    onClose();
  };

  const handleRetry = () => {
    setStep("form");
    setErrorMessage("");
  };

  // Dialog dùng chung (QA4 S15): role="dialog" + aria-modal, nhãn từ tiêu đề, bẫy focus, Esc để đóng và trả
  // focus về nút đã mở. Trước đây là div thường nên trình đọc màn hình không biết đây là hộp thoại.
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle className="mb-5 pr-8 text-lg font-medium">Mời phụ huynh</DialogTitle>
        <div>
          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email input */}
              <div>
                <label htmlFor="invite-parent-email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email phụ huynh
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="invite-parent-email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    autoFocus
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Phụ huynh sẽ nhận được email với liên kết để tham gia
                </p>
              </div>

              {/* Relationship selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mối quan hệ
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {relationships.map((rel) => (
                    <button
                      key={rel.value}
                      type="button"
                      onClick={() => setRelationship(rel.value)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                        relationship === rel.value
                          ? "border-primary-500 bg-primary-50"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          relationship === rel.value
                            ? "bg-primary-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {rel.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{rel.label}</p>
                        <p className="text-xs text-slate-500">{rel.description}</p>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          relationship === rel.value ? "border-primary-600 bg-primary-600" : "border-slate-300"
                        )}
                      >
                        {relationship === rel.value && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional message */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lời nhắn <span className="text-slate-500 font-normal">(tuỳ chọn)</span>
                </label>
                <textarea
                  placeholder="Gửi lời nhắn kèm theo lời mời..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none text-sm transition-colors"
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-slate-500 text-right">{message.length}/500</p>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full h-12 rounded-full text-base">
                <Send className="w-4 h-4 mr-2" />
                Gửi lời mời
              </Button>
            </form>
          )}

          {step === "sending" && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">Đang gửi lời mời</h3>
              <p className="text-sm text-slate-500">Vui lòng đợi trong giây lát...</p>
            </div>
          )}

          {step === "success" && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">Đã gửi lời mời!</h3>
              <p className="text-sm text-slate-500 mb-6">
                Lời mời đã được gửi đến <span className="font-medium">{email}</span>
              </p>
              <div className="p-4 bg-primary-50 rounded-xl text-left border border-primary-100">
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-primary-700">Bước tiếp theo:</span> Phụ huynh sẽ nhận được email
                  với liên kết để chấp nhận lời mời. Lời mời có hiệu lực trong 7 ngày.
                </p>
              </div>
              <Button onClick={handleClose} className="w-full h-12 mt-6">
                Đóng
              </Button>
            </div>
          )}

          {step === "error" && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">Không thể gửi lời mời</h3>
              <p className="text-sm text-slate-500 mb-6">{errorMessage}</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1 h-12">
                  Đóng
                </Button>
                {canRetry && (
                  <Button onClick={handleRetry} className="flex-1 h-12">
                    Thử lại
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
