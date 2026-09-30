"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  iconOnly?: boolean;
}

const providerConfig: Record<SocialProvider, { label: string; icon: React.ReactNode }> = {
  google: { label: "Google", icon: <GoogleIcon /> },
  facebook: { label: "Facebook", icon: <FacebookIcon /> },
  apple: { label: "Apple", icon: <AppleIcon /> },
  github: { label: "GitHub", icon: <GithubIcon /> },
  email: { label: "Email", icon: <MailIcon /> },
};

export function SocialLoginButton({ provider, onClick, className, iconOnly }: SocialLoginButtonProps) {
  const config = providerConfig[provider];

  if (iconOnly) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`Đăng nhập với ${config.label}`}
        onClick={onClick}
        className={cn("h-12 w-12 rounded-full", className)}
      >
        <span className="flex h-6 w-6 items-center justify-center">{config.icon}</span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      aria-label={`Đăng nhập với ${config.label}`}
      onClick={onClick}
      className={cn("h-12 w-full gap-3 px-4 text-sm", className)}
    >
      <span className="flex h-6 w-6 items-center justify-center">{config.icon}</span>
      <span>{config.label}</span>
    </Button>
  );
}
