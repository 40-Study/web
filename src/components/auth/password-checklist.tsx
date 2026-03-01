"use client";

import { cn } from "@/lib/utils";
import { SmallCheckIcon } from "@/components/icons";

interface PasswordChecklistProps {
  password: string;
  className?: string;
}

interface Rule {
  label: string;
  test: (password: string) => boolean;
}

const rules: Rule[] = [
  { label: "Ít nhất 8 ký tự", test: (p) => p.length >= 8 },
  { label: "Chứa chữ hoa (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "Chứa chữ thường (a-z)", test: (p) => /[a-z]/.test(p) },
  { label: "Chứa số hoặc ký tự đặc biệt", test: (p) => /[\d\W]/.test(p) },
];

export function PasswordChecklist({ password, className }: PasswordChecklistProps) {
  return (
    <ul className={cn("space-y-2", className)}>
      {rules.map((rule) => {
        const passed = password.length > 0 && rule.test(password);
        return (
          <li key={rule.label} className="flex items-center gap-2 text-sm">
            <div
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white",
                passed ? "bg-green-500" : "bg-gray-300"
              )}
            >
              <SmallCheckIcon size={8} />
            </div>
            <span className={passed ? "text-green-700" : "text-gray-500"}>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
