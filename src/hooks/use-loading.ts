import { useState, useCallback } from "react";

/**
 * Hook for managing loading states with async operations
 *
 * @example
 * const { isLoading, withLoading } = useLoading();
 *
 * const handleSubmit = withLoading(async () => {
 *   await api.submit(data);
 * });
 *
 * <Button isLoading={isLoading} onClick={handleSubmit}>Submit</Button>
 */
export function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  const withLoading = useCallback(
    <T,>(fn: () => Promise<T>) => {
      return async () => {
        setIsLoading(true);
        try {
          return await fn();
        } finally {
          setIsLoading(false);
        }
      };
    },
    []
  );

  return {
    isLoading,
    setIsLoading,
    startLoading,
    stopLoading,
    withLoading,
  };
}

/**
 * Hook for managing multiple loading states
 *
 * @example
 * const { isLoading, withLoading } = useLoadingStates();
 *
 * const handleSave = withLoading("save", async () => { ... });
 * const handleDelete = withLoading("delete", async () => { ... });
 *
 * <Button isLoading={isLoading("save")}>Save</Button>
 * <Button isLoading={isLoading("delete")}>Delete</Button>
 */
export function useLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const isLoading = useCallback(
    (key: string) => loadingStates[key] ?? false,
    [loadingStates]
  );

  const setLoading = useCallback((key: string, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  }, []);

  const withLoading = useCallback(
    <T,>(key: string, fn: () => Promise<T>) => {
      return async () => {
        setLoadingStates((prev) => ({ ...prev, [key]: true }));
        try {
          return await fn();
        } finally {
          setLoadingStates((prev) => ({ ...prev, [key]: false }));
        }
      };
    },
    []
  );

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  return {
    isLoading,
    setLoading,
    withLoading,
    isAnyLoading,
    loadingStates,
  };
}
