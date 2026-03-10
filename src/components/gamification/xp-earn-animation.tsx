"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface XPEarnAnimationProps {
  amount: number;
  position: { x: number; y: number };
  onComplete?: () => void;
}

/**
 * Floating XP animation that appears when user earns XP
 * Shows "+{amount} XP" text floating upward and fading out
 */
export function XPEarnAnimation({
  amount,
  position,
  onComplete,
}: XPEarnAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed pointer-events-none z-50 animate-float-up",
        "flex items-center gap-1"
      )}
      style={{ left: position.x, top: position.y }}
      aria-live="polite"
      aria-label={`Earned ${amount} XP`}
    >
      <span className="text-2xl font-bold text-xp drop-shadow-lg">
        +{amount} XP
      </span>
      <span className="text-lg">✨</span>
    </div>
  );
}

interface XPEarnAnimationManagerProps {
  animations: Array<{
    id: string;
    amount: number;
    position: { x: number; y: number };
  }>;
  onAnimationComplete: (id: string) => void;
}

/**
 * Manager component to handle multiple XP animations
 * Useful when user earns XP from multiple sources rapidly
 */
export function XPEarnAnimationManager({
  animations,
  onAnimationComplete,
}: XPEarnAnimationManagerProps) {
  return (
    <>
      {animations.map((anim) => (
        <XPEarnAnimation
          key={anim.id}
          amount={anim.amount}
          position={anim.position}
          onComplete={() => onAnimationComplete(anim.id)}
        />
      ))}
    </>
  );
}
