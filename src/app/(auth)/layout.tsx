export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // id="main-content": đích của skip link trong app/layout.tsx; cũng là landmark <main> duy nhất của trang auth
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-background px-4 py-8"
    >
      {children}
    </main>
  );
}
