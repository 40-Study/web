import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SkipLink } from "@/components/ui";
import { SITE_URL } from "@/lib/seo";
import { THEME_STORAGE_KEY } from "@/lib/appearance-storage";

const inter = Inter({
    subsets: ["latin", "vietnamese"],
    variable: "--font-inter",
    display: "swap", // Prevent FOIT - show fallback font immediately, swap when loaded
});

export const metadata: Metadata = {
    // Bắt buộc có: thiếu metadataBase thì mọi URL ảnh OG tương đối sẽ hỏng
    // khi link được chia sẻ ra Facebook/Zalo/LinkedIn.
    metadataBase: new URL(SITE_URL),
    title: {
        default: "ForteX",
        template: "%s | ForteX",
    },
    description: "ForteX - Learn Leap Lead | Nền tảng học tập và quản lý hiện đại",
    keywords: ["ForteX", "learning", "education"],
    openGraph: {
        type: "website",
        siteName: "ForteX",
        locale: "vi_VN",
        title: "ForteX — Learn Leap Lead",
        description: "Nền tảng học tập và quản lý hiện đại",
        url: SITE_URL,
        images: [{ url: "/logo.png", width: 512, height: 512, alt: "ForteX" }],
    },
    twitter: {
        card: "summary",
        title: "ForteX — Learn Leap Lead",
        description: "Nền tảng học tập và quản lý hiện đại",
        images: ["/logo.png"],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans antialiased`}>
                {/*
                  Chống nháy màn hình (FOUC) dark mode (H-01): script chạy TRƯỚC khi
                  React hydrate, đọc theme đã lưu và gắn class .dark lên <html> ngay
                  lập tức. Phải cùng quy tắc với applyTheme (appearance-storage.ts):
                  chỉ "dark" chọn tay mới bật, "system" chưa theo OS (xem ghi chú ở đó).
                */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{var t=localStorage.getItem(${JSON.stringify(
                            THEME_STORAGE_KEY
                        )});document.documentElement.classList.toggle("dark",t==="dark");}catch(e){}})();`,
                    }}
                />
                <ThemeProvider />
                <SkipLink targetId="main-content">
                    Bỏ qua điều hướng
                </SkipLink>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
