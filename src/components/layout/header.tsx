"use client";

import Link from "next/link";
import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems, siteConfig } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/auth-modal";
import { Avatar } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth.store";

export function Header() {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: "login" | "register" }>({
        isOpen: false,
        mode: "login",
    });
    const mobileMenuId = useId();
    const { isAuthenticated, user, logout } = useAuthStore();

    const openLogin = () => {
        setIsMenuOpen(false);
        setAuthModal({ isOpen: true, mode: "login" });
    };

    const openRegister = () => {
        setIsMenuOpen(false);
        setAuthModal({ isOpen: true, mode: "register" });
    };

    const closeAuthModal = () => {
        setAuthModal({ isOpen: false, mode: "login" });
    };

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
        router.push("/");
    };

    return (
        <header
            role="banner"
            className="sticky top-0 z-50 w-full border-b bg-white"
        >
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-md"
                    aria-label={`${siteConfig.name} - Trang chủ`}
                >
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500"
                        aria-hidden="true"
                    >
                        <span className="text-sm font-bold text-white">FX</span>
                    </div>
                    <span className="text-xl font-bold">{siteConfig.name}</span>
                </Link>

                {/* Desktop Navigation */}
                <nav
                    className="hidden md:flex md:items-center md:space-x-6"
                    role="navigation"
                    aria-label="Điều hướng chính"
                >
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-md px-2 py-1"
                        >
                            {item.title}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center space-x-4">
                    <div className="hidden md:flex md:items-center md:space-x-2">
                        {isAuthenticated ? (
                            <>
                                <Link href="/home" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                                    {user?.name || "Tài khoản"}
                                </Link>
                                <Avatar fallback={user?.name || "TK"} size="sm" />
                                <Button variant="ghost" size="sm" onClick={handleLogout}>
                                    Đăng xuất
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" onClick={openLogin}>
                                    Đăng nhập
                                </Button>
                                <Button size="sm" onClick={openRegister}>
                                    Đăng ký
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-expanded={isMenuOpen}
                        aria-controls={mobileMenuId}
                        aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            {isMenuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div
                id={mobileMenuId}
                className={cn(
                    "md:hidden",
                    isMenuOpen ? "block" : "hidden"
                )}
                role="region"
                aria-label="Menu di động"
            >
                <nav
                    className="border-t px-4 py-4"
                    role="navigation"
                    aria-label="Điều hướng di động"
                >
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="block py-3 min-h-[44px] text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-md px-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {item.title}
                        </Link>
                    ))}
                    <div className="mt-4 flex flex-col space-y-2">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    href="/home"
                                    className="block py-3 min-h-[44px] text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-md px-2"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {user?.name || "Tài khoản"}
                                </Link>
                                <Button variant="ghost" size="sm" className="min-h-[44px]" onClick={handleLogout}>
                                    Đăng xuất
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" className="min-h-[44px]" onClick={openLogin}>
                                    Đăng nhập
                                </Button>
                                <Button size="sm" className="min-h-[44px]" onClick={openRegister}>
                                    Đăng ký
                                </Button>
                            </>
                        )}
                    </div>
                </nav>
            </div>

            {/* Auth Modal */}
            <AuthModal
                isOpen={authModal.isOpen}
                onClose={closeAuthModal}
                initialMode={authModal.mode}
            />
        </header>
    );
}
