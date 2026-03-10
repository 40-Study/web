"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface XPToastProps {
  xp: number;
  streakDay?: number;
  onClose: () => void;
  autoCloseDelay?: number;
}

export function XPToast({
  xp,
  streakDay,
  onClose,
  autoCloseDelay = 5000,
}: XPToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const enterTimeout = setTimeout(() => setIsVisible(true), 50);

    // Auto close
    const closeTimeout = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, autoCloseDelay);

    return () => {
      clearTimeout(enterTimeout);
      clearTimeout(closeTimeout);
    };
  }, [autoCloseDelay, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4"
      )}
    >
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 flex items-center gap-4 shadow-lg">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded"
          aria-label="Dong"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-3xl animate-bounce">🎉</div>

        <div>
          <p className="font-bold text-lg">+{xp} XP</p>
          <p className="text-sm opacity-90">Hoan thanh bai hoc!</p>
        </div>

        {streakDay && (
          <div className="border-l border-white/30 pl-4 ml-2">
            <p className="text-2xl">🔥</p>
            <p className="text-sm">{streakDay} ngay lien tiep!</p>
          </div>
        )}
      </Card>
    </div>
  );
}
