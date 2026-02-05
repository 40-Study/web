"use client";

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <>
            {/* Add providers here as needed, e.g.:
        <ThemeProvider>
        <QueryClientProvider>
        <AuthProvider>
      */}
            {children}
        </>
    );
}
