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
          <h1 className="text-3xl font-bold text-primary-600">ForteX</h1>
          <p className="text-xs tracking-[0.2em] text-muted-foreground mt-1 uppercase">Learn · Leap · Lead</p>
        </div>
      )}
      {children}
    </div>
  );
}
