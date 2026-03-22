import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

function FloatingShapes() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            {/* Floating circles */}
            <div className="absolute top-[10%] left-[5%] w-20 h-20 rounded-full bg-primary-200/30 animate-[float_6s_ease-in-out_infinite]" />
            <div className="absolute top-[20%] right-[10%] w-14 h-14 rounded-full bg-secondary-200/25 animate-[float_8s_ease-in-out_infinite_1s]" />
            <div className="absolute bottom-[15%] left-[15%] w-10 h-10 rounded-full bg-primary-300/20 animate-[float_7s_ease-in-out_infinite_2s]" />
            <div className="absolute top-[60%] right-[5%] w-16 h-16 rounded-full bg-secondary-300/20 animate-[float_9s_ease-in-out_infinite_0.5s]" />
            <div className="absolute top-[40%] left-[45%] w-8 h-8 rounded-full bg-primary-100/40 animate-[float_5s_ease-in-out_infinite_3s]" />
            <div className="absolute bottom-[30%] right-[25%] w-12 h-12 rounded-full bg-primary-200/20 animate-[float_10s_ease-in-out_infinite_1.5s]" />

            {/* Floating dots */}
            <div className="absolute top-[30%] left-[25%] w-3 h-3 rounded-full bg-primary-400/30 animate-[float_4s_ease-in-out_infinite_0.5s]" />
            <div className="absolute top-[50%] right-[30%] w-4 h-4 rounded-full bg-secondary-400/25 animate-[float_6s_ease-in-out_infinite_2s]" />
            <div className="absolute bottom-[40%] left-[60%] w-3 h-3 rounded-full bg-primary-500/20 animate-[float_5s_ease-in-out_infinite_1s]" />
            <div className="absolute top-[15%] left-[70%] w-5 h-5 rounded-full bg-secondary-200/30 animate-[float_7s_ease-in-out_infinite_3s]" />

            {/* Soft blurred blobs */}
            <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary-100/40 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-secondary-100/30 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-50/50 blur-3xl" />
        </div>
    );
}

export default function HomePage() {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            <Header />

            <main className="flex-1">
                {/* Hero Section - White with floating shapes */}
                <section className="relative overflow-hidden bg-white py-28 md:py-36">
                    <FloatingShapes />
                    <div className="container relative mx-auto px-4 text-center">
                        <p className="mb-4 text-sm font-semibold tracking-[0.25em] text-primary-500 uppercase">
                            Learn · Leap · Lead
                        </p>
                        <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                            Chào mừng đến với{" "}
                            <span className="bg-gradient-to-r from-primary-500 to-secondary-600 bg-clip-text text-transparent">
                                ForteX
                            </span>
                        </h1>
                        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
                            Nền tảng học tập và quản lý hiện đại, giúp bạn đạt được mục tiêu của mình.
                        </p>
                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Button size="lg">
                                Bắt đầu ngay
                            </Button>
                            <Button size="lg" variant="outline">
                                Tìm hiểu thêm
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="relative overflow-hidden bg-surface py-20">
                    <div className="container mx-auto px-4">
                        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
                            Tính năng nổi bật
                        </h2>
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="group p-6 transition-all hover:shadow-lg hover:-translate-y-1 bg-white">
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

                            <Card className="group p-6 transition-all hover:shadow-lg hover:-translate-y-1 bg-white">
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

                            <Card className="group p-6 transition-all hover:shadow-lg hover:-translate-y-1 bg-white">
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
