"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
  className?: string;
  countdown?: number;
  onResend?: () => void;
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

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;

      setOtp((prev) => {
        const newOtp = [...prev];
        newOtp[index] = value.slice(-1);

        if (value && index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }

        const joined = newOtp.join("");
        if (joined.length === length) {
          onCompleteRef.current?.(joined);
        }

        return newOtp;
      });
    },
    [length]
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
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (!pastedData) return;

      setOtp(() => {
        const newOtp = Array(length).fill("");
        for (let i = 0; i < pastedData.length; i++) {
          newOtp[i] = pastedData[i];
        }

        const focusIndex = Math.min(pastedData.length, length - 1);
        inputRefs.current[focusIndex]?.focus();

        if (pastedData.length === length) {
          onCompleteRef.current?.(pastedData);
        }

        return newOtp;
      });
    },
    [length]
  );

  const handleResend = () => {
    setTimeLeft(countdown);
    setOtp(Array(length).fill(""));
    inputRefs.current[0]?.focus();
    onResend?.();
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
            maxLength={1}
            value={digit}
            aria-label={`Chữ số OTP ${index + 1}`}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="h-12 w-12 rounded-lg border border-gray-300 text-center text-lg font-semibold focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:h-14 sm:w-14"
            autoFocus={index === 0}
          />
        ))}
      </div>

      <div className="text-center">
        {timeLeft > 0 ? (
          <p className="text-sm text-gray-500">
            Gửi lại mã sau{" "}
            <span className="font-medium text-primary-600">{formatTime(timeLeft)}</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Gửi lại mã
          </button>
        )}
      </div>
    </div>
  );
}
