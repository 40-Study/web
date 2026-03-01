import { cn } from "@/lib/utils";

interface AuthIconHeaderProps {
  icon: React.ReactNode;
  iconBgClassName?: string;
  title: string;
  description: string;
  className?: string;
}

export function AuthIconHeader({
  icon,
  iconBgClassName = "bg-primary-100",
  title,
  description,
  className,
}: AuthIconHeaderProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className={cn(
          "mb-4 flex h-16 w-16 items-center justify-center rounded-full",
          iconBgClassName
        )}
      >
        {icon}
      </div>
      <h2 className="mb-1 text-xl font-semibold text-gray-900">{title}</h2>
      <p className="text-center text-sm text-gray-500">{description}</p>
    </div>
  );
}
