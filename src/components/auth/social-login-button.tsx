"use client";

import { cn } from "@/lib/utils";
import {
  GoogleIcon,
  FacebookIcon,
  AppleIcon,
  GithubIcon,
  MailIcon,
} from "@/components/icons";

type SocialProvider = "google" | "facebook" | "apple" | "github" | "email";

interface SocialLoginButtonProps {
  provider: SocialProvider;
  onClick?: () => void;
  className?: string;
}

const providerConfig: Record<SocialProvider, { label: string; icon: React.ReactNode }> = {
  google: { label: "Google", icon: <GoogleIcon /> },
  facebook: { label: "Facebook", icon: <FacebookIcon /> },
  apple: { label: "Apple", icon: <AppleIcon /> },
  github: { label: "Github", icon: <GithubIcon /> },
  email: { label: "Email", icon: <MailIcon /> },
};

export function SocialLoginButton({ provider, onClick, className }: SocialLoginButtonProps) {
  const config = providerConfig[provider];

  return (
    <button
      type="button"
      aria-label={`Đăng nhập với ${config.label}`}
      onClick={onClick}
      className={cn(
        "flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50",
        className
      )}
    >
      <span className="flex h-6 w-6 items-center justify-center">{config.icon}</span>
      <span>{config.label}</span>
    </button>
  );
}
