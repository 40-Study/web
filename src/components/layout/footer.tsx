import Link from "next/link";
import { siteConfig, navItems } from "@/lib/constants";

export function Footer() {
    return (
        <footer className="border-t bg-muted/50">
            <div className="container mx-auto px-4 py-12">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-600">
                                <span className="text-lg font-bold text-white">40</span>
                            </div>
                            <span className="text-xl font-bold">{siteConfig.name}</span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            {siteConfig.description}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold">Điều hướng</h3>
                        <ul className="space-y-2">
                            {navItems.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {item.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold">Tài nguyên</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/docs"
                                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    Tài liệu
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/blog"
                                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/support"
                                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    Hỗ trợ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold">Liên hệ</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>Email: contact@40study.com</li>
                            <li>Phone: (84) 123-456-789</li>
                        </ul>
                        <div className="mt-4 flex space-x-4">
                            <a
                                href={siteConfig.links.facebook}
                                className="text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Facebook"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </a>
                            <a
                                href={siteConfig.links.github}
                                className="text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="GitHub"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} {siteConfig.name}. Tất cả quyền được bảo lưu.</p>
                </div>
            </div>
        </footer>
    );
}
