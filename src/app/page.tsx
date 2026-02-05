import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 py-24">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                    <div className="container relative mx-auto px-4 text-center">
                        <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
                            Chào mừng đến với{" "}
                            <span className="bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">
                                40Study
                            </span>
                        </h1>
                        <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-100">
                            Nền tảng học tập và quản lý hiện đại, giúp bạn đạt được mục tiêu của mình.
                        </p>
                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Button size="lg" variant="secondary">
                                Bắt đầu ngay
                            </Button>
                            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                                Tìm hiểu thêm
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20">
                    <div className="container mx-auto px-4">
                        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
                            Tính năng nổi bật
                        </h2>
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="group p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-xl font-semibold">Nhanh chóng</h3>
                                <p className="text-muted-foreground">
                                    Trải nghiệm mượt mà với hiệu suất tối ưu.
                                </p>
                            </Card>

                            <Card className="group p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-100 text-secondary-600">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-xl font-semibold">Bảo mật</h3>
                                <p className="text-muted-foreground">
                                    Dữ liệu của bạn luôn được bảo vệ an toàn.
                                </p>
                            </Card>

                            <Card className="group p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-xl font-semibold">Dễ sử dụng</h3>
                                <p className="text-muted-foreground">
                                    Giao diện trực quan, dễ dàng làm quen.
                                </p>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
