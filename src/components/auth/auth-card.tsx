import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
  showLogo?: boolean;
}

export function AuthCard({ children, className, showLogo = true }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[546px] rounded-2xl bg-white px-10 py-8 shadow-lg",
        className
      )}
    >
      {showLogo && (
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary-600">40Study</h1>
        </div>
      )}
      {children}
    </div>
  );
}
