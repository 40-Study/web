"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/query-client";
import { AuthBootstrap } from "./auth-bootstrap";
import { TOAST_STYLE } from "./toast-colors";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      {children}
      <Toaster position="top-right" richColors closeButton style={TOAST_STYLE} />
    </QueryClientProvider>
  );
}
