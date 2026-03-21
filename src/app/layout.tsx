import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SkipLink } from "@/components/ui";

const inter = Inter({
    subsets: ["latin", "vietnamese"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: {
        default: "40Study",
        template: "%s | 40Study",
    },
    description: "Nền tảng học tập và quản lý 40Study",
    keywords: ["40Study", "learning", "education"],
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
