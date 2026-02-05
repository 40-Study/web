"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { navItems, siteConfig } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-600">
                        <span className="text-lg font-bold text-white">40</span>
                    </div>
                    <span className="text-xl font-bold">{siteConfig.name}</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex md:items-center md:space-x-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
                        className="md:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
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
                className={cn(
                    "md:hidden",
                    isMenuOpen ? "block" : "hidden"
                )}
            >
                <nav className="border-t px-4 py-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {item.title}
                        </Link>
                    ))}
                    <div className="mt-4 flex flex-col space-y-2">
                        <Button variant="ghost" size="sm">
                            Đăng nhập
                        </Button>
                        <Button size="sm">Đăng ký</Button>
                    </div>
                </nav>
            </div>
        </header>
    );
}
