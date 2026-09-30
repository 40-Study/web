import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { cn } from "@/lib/utils";

/** CTA cuối trang: gradient duy nhất được phép ngoài radial của hero. */
export function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 md:pb-20 lg:px-8 lg:pb-24">
      <ScrollReveal>
        <div className="rounded-3xl bg-gradient-to-br from-primary-600 to-primary-700 px-6 py-12 text-center text-white md:px-12 md:py-16">
          <h2 className="text-h1 mx-auto max-w-2xl">Sẵn sàng bắt đầu hành trình học tập?</h2>
          <p className="text-body-lg mx-auto mt-4 max-w-xl text-primary-50">
            Chọn khóa học phù hợp và để lộ trình cá nhân hóa dẫn đường cho bạn.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/courses"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "min-h-11 w-full gap-2 border-transparent bg-white text-primary-700 hover:bg-slate-100 dark:border-transparent dark:bg-white dark:text-primary-700 dark:hover:bg-slate-100 sm:w-auto"
              )}
            >
              Xem các khóa học
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
