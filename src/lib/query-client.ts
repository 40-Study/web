/**
 * React Query client configuration
 */

import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AuthError, NetworkError, ValidationError } from "./errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (error instanceof AuthError) return false;
        return failureCount < 2;
      },
      staleTime: 30_000, // 30 seconds
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        // Validation errors handled by form
        if (error instanceof ValidationError) return;

        if (error instanceof NetworkError) {
          toast.error("Connection lost", { description: error.message });
          return;
        }

        toast.error("Error", {
          description: error instanceof Error ? error.message : "Something went wrong"
        });
      },
    },
  },
});
