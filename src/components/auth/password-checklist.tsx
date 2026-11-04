"use client";

import { cn } from "@/lib/utils";
import { SmallCheckIcon } from "@/components/icons";
import { PASSWORD_RULES } from "@/lib/password-policy";

interface PasswordChecklistProps {
  password: string;
  className?: string;
}

export function PasswordChecklist({ password, className }: PasswordChecklistProps) {
  return (
    <ul className={cn("space-y-2", className)}>
      {PASSWORD_RULES.map((rule) => {
        const passed = password.length > 0 && rule.test(password);
        return (
          <li key={rule.id} className="flex items-center gap-2 text-sm">
            <div
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white",
                passed ? "bg-green-500" : "bg-border"
              )}
            >
              <SmallCheckIcon size={8} />
            </div>
            <span className={passed ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
