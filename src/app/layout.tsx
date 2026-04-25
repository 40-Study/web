import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SkipLink } from "@/components/ui";

const inter = Inter({
    subsets: ["latin", "vietnamese"],
    variable: "--font-inter",
    display: "swap", // Prevent FOIT - show fallback font immediately, swap when loaded
});

export const metadata: Metadata = {
    title: {
        default: "ForteX",
        template: "%s | ForteX",
    },
    description: "ForteX - Learn Leap Lead | Nền tảng học tập và quản lý hiện đại",
    keywords: ["ForteX", "learning", "education"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans antialiased`}>
                <SkipLink targetId="main-content">
                    Bỏ qua điều hướng
                </SkipLink>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
