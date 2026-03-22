'use client';

export default function MeetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0e0e0e]">
      {children}
    </div>
  );
}
