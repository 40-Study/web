import { Toaster } from "sonner";

export default function LessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
      <Toaster position="bottom-center" />
    </div>
  );
}
