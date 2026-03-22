export const siteConfig = {
    name: "ForteX",
    tagline: "Learn Leap Lead",
    description: "ForteX - Learn Leap Lead | Nền tảng học tập và quản lý hiện đại",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ogImage: "/og.png",
    links: {
        github: "#",
        facebook: "#",
    },
} as const;

export const navItems = [
    {
        title: "Trang chủ",
        href: "/",
    },
    {
        title: "Khóa học",
        href: "/courses",
    },
    {
        title: "Giới thiệu",
        href: "/about",
    },
    {
        title: "Liên hệ",
        href: "/contact",
    },
] as const;
