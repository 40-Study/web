"use client";

import { Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Reward {
  id: string;
  name: string;
  icon: string;
  type: "xp" | "badge" | "feature" | "item";
}

interface LevelUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newLevel: number;
  rewards?: Reward[];
  onContinue?: () => void;
}

/**
 * Celebration modal shown when user levels up
 * Displays new level, any rewards unlocked, and confetti animation
 */
export function LevelUpModal({
  open,
  onOpenChange,
  newLevel,
  rewards = [],
  onContinue,
}: LevelUpModalProps) {
  const handleContinue = () => {
    onContinue?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center max-w-md" showCloseButton={false}>
        {/* Confetti particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          <Confetti />
        </div>

        {/* Level badge */}
        <div className="relative mx-auto w-32 h-32 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full animate-pulse-glow" />
          <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-medium">LEVEL</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                {newLevel}
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Level Up!
        </h2>
        <p className="text-muted-foreground mb-6">
          Congratulations! You&apos;ve reached level {newLevel}!
        </p>

        {/* Rewards */}
        {rewards.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              You unlocked:
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              {rewards.map((reward) => (
                <div key={reward.id} className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mb-1 text-2xl">
                    {reward.icon}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {reward.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleContinue} className="w-full" size="lg">
          <Sparkles className="h-4 w-4 mr-2" />
          Continue Learning
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Simple confetti animation using CSS
 */
function Confetti() {
  const colors = [
    "bg-yellow-400",
    "bg-pink-400",
    "bg-blue-400",
    "bg-green-400",
    "bg-purple-400",
    "bg-orange-400",
  ];

  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.5}s`,
    duration: `${1 + Math.random() * 1}s`,
    size: Math.random() > 0.5 ? "w-2 h-2" : "w-1.5 h-3",
  }));

  return (
    <>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={cn(
            particle.color,
            particle.size,
            "absolute rounded-sm opacity-80"
          )}
          style={{
            left: particle.left,
            top: "-10px",
            animation: `confetti-fall ${particle.duration} ease-out ${particle.delay} forwards`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
