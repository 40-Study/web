"use client";

import Link from "next/link";
import { useState, useId } from "react";
import { cn } from "@/lib/utils";
import { navItems, siteConfig } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const mobileMenuId = useId();

    return (
        <header
            role="banner"
            className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-md"
                    aria-label={`${siteConfig.name} - Trang chủ`}
                >
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-600"
                        aria-hidden="true"
                    >
                        <span className="text-lg font-bold text-white">40</span>
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
                        <Button variant="ghost" size="sm">
                            Đăng nhập
                        </Button>
                        <Button size="sm">Đăng ký</Button>
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
                        <Button variant="ghost" size="sm" className="min-h-[44px]">
                            Đăng nhập
                        </Button>
                        <Button size="sm" className="min-h-[44px]">
                            Đăng ký
                        </Button>
                    </div>
                </nav>
            </div>
        </header>
    );
}
