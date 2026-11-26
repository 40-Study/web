"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
  className?: string;
  countdown?: number;
  /**
   * Gửi lại mã. Trả `false` hoặc reject = gửi KHÔNG thành công: đồng hồ đếm ngược không được khởi động lại
   * (Q5-PG-07: "Gửi lại mã sau 01:28" từng hiện dù yêu cầu vừa bị 429). Trả void/true = coi là thành công.
   */
  onResend?: () => void | boolean | Promise<void | boolean>;
}

export function OtpInput({
  length = 6,
  onComplete,
  className,
  countdown = 90,
  onResend,
}: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const [timeLeft, setTimeLeft] = useState(countdown);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Cả mã (dán, hoặc trình duyệt/bàn phím điện thoại tự điền qua autocomplete="one-time-code") đổ vào các ô từ ô đầu.
  const applyDigits = useCallback(
    (digits: string) => {
      const pastedData = digits.replace(/\D/g, "").slice(0, length);
      if (!pastedData) return;

      const newOtp = Array(length).fill("");
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);

      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex]?.focus();

      if (pastedData.length === length) {
        onCompleteRef.current?.(pastedData);
      }
    },
    [length]
  );

  // N-14 (QA4 261123): tính mã mới từ state hiện tại rồi gọi `onComplete` NGOÀI hàm cập nhật của setOtp. Gọi bên
  // trong thì React chạy nó lúc render OtpInput, setState của trang cha thành "update while rendering".
  const handleChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      // Q8-PG-08: ô đầu nhận cả mã khi trình duyệt tự điền mã một lần (one-time-code).
      if (value.length > 1) {
        applyDigits(value);
        return;
      }

      const newOtp = [...otp];
      newOtp[index] = value.slice(-1);
      setOtp(newOtp);

      if (value && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      const joined = newOtp.join("");
      if (joined.length === length) {
        onCompleteRef.current?.(joined);
      }
    },
    [length, otp, applyDigits]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        setOtp((prev) => {
          if (!prev[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
          }
          return prev;
        });
      }
    },
    []
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      applyDigits(e.clipboardData.getData("text"));
    },
    [applyDigits]
  );

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    let ok = true;
    try {
      ok = (await onResend?.()) !== false;
    } catch {
      ok = false;
    } finally {
      setResending(false);
    }
    if (!ok) return;
    setTimeLeft(countdown);
    setOtp(Array(length).fill(""));
    inputRefs.current[0]?.focus();
  };

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <div className="flex gap-3" onPaste={handlePaste} role="group" aria-label="Mã OTP">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            // Ô đầu cho tới `length` ký tự để mã tự điền (one-time-code) không bị cắt còn một số; ô sau vẫn một số.
            maxLength={index === 0 ? length : 1}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            name={index === 0 ? "otp" : undefined}
            value={digit}
            aria-label={`Chữ số OTP ${index + 1}`}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="h-12 w-12 rounded-lg border border-border bg-card text-foreground text-center text-lg font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary sm:h-14 sm:w-14"
            autoFocus={index === 0}
          />
        ))}
      </div>

      <div className="text-center">
        {timeLeft > 0 ? (
          <p className="text-sm text-muted-foreground">
            Gửi lại mã sau{" "}
            <span className="font-medium text-primary">{formatTime(timeLeft)}</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-sm font-medium text-primary hover:text-primary disabled:opacity-60"
          >
            {resending ? "Đang gửi..." : "Gửi lại mã"}
          </button>
        )}
      </div>
    </div>
  );
}
