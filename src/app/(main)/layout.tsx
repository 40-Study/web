"use client";

import { AppShellLayout } from "@/components/layout/app-shell-layout";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
