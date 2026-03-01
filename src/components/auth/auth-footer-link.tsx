import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthFooterLinkProps {
  text: string;
  linkText: string;
  href: string;
  className?: string;
}

export function AuthFooterLink({ text, linkText, href, className }: AuthFooterLinkProps) {
  return (
    <p className={cn("text-center text-sm text-gray-500", className)}>
      {text}{" "}
      <Link href={href} className="font-medium text-primary-600 hover:text-primary-700">
        {linkText}
      </Link>
    </p>
  );
}
