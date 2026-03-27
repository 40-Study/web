"use client";

import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  variant?: "default" | "minimal" | "dots" | "pulse";
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({
  variant = "default",
  text = "Đang tải...",
  className,
  fullScreen = true,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5",
        fullScreen && "min-h-screen",
        className
      )}
    >
      <div className="flex flex-col items-center gap-6">
        {variant === "default" && <BookLoader />}
        {variant === "minimal" && <MinimalLoader />}
        {variant === "dots" && <DotsLoader />}
        {variant === "pulse" && <PulseLoader />}

        {text && (
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

// Book flip animation - perfect for education app
function BookLoader() {
  return (
    <div className="relative w-20 h-16">
      {/* Book shadow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-2 bg-primary/20 rounded-full blur-sm" />

      {/* Book pages */}
      <div className="relative w-full h-full">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 bottom-2 w-8 h-12 origin-left animate-book-flip"
            style={{
              animationDelay: `${i * 0.15}s`,
            }}
          >
            <div
              className={cn(
                "absolute inset-0 rounded-r-sm border-r-2",
                i === 0 && "bg-primary/90 border-primary",
                i === 1 && "bg-primary/70 border-primary/80",
                i === 2 && "bg-primary/50 border-primary/60",
                i === 3 && "bg-primary/30 border-primary/40"
              )}
            />
          </div>
        ))}

        {/* Book spine */}
        <div className="absolute left-1/2 -translate-x-[1px] bottom-2 w-1 h-12 bg-primary rounded-l-sm" />
      </div>
    </div>
  );
}

// Minimal spinning loader with gradient
function MinimalLoader() {
  return (
    <div className="relative w-16 h-16">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-4 border-primary/20" />

      {/* Spinning gradient ring */}
      <div
        className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
        style={{
          borderTopColor: "hsl(var(--primary))",
          borderRightColor: "hsl(var(--primary) / 0.5)",
          animationDuration: "1s",
        }}
      />

      {/* Center dot */}
      <div className="absolute inset-4 rounded-full bg-primary/10 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      </div>
    </div>
  );
}

// Bouncing dots loader
function DotsLoader() {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full bg-primary animate-dot-bounce"
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// Pulse rings loader
function PulseLoader() {
  return (
    <div className="relative w-20 h-20">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full border-2 border-primary animate-pulse-ring"
          style={{
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}

      {/* Center icon - book */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
    </div>
  );
}

// Skeleton loader for content
export function SkeletonLoader({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} />
  );
}

// Page loading overlay
export function PageLoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingScreen variant="minimal" text={text} fullScreen={false} />
    </div>
  );
}
