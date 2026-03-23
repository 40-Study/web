/**
 * Reusable toast helper functions
 */

import { toast } from "sonner";

export const showComingSoon = () => {
  toast.info("Tính năng đang phát triển");
};

export const showError = (message: string, description?: string) => {
  toast.error(message, { description });
};

export const showSuccess = (message: string, description?: string) => {
  toast.success(message, { description });
};

export const showXPGained = (xp: number, message?: string) => {
  toast.success(`+${xp} XP!`, {
    description: message || "Bạn đã nhận được XP",
  });
};
