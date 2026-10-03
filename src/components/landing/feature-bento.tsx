import type { LucideIcon } from "lucide-react";
import { BarChart3, Route, Smartphone, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { cn } from "@/lib/utils";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Số cột trên lưới 6 cột (md+). */
  span: string;
}

const FEATURES: Feature[] = [
  {
    icon: Video,
    title: "Bài giảng video và buổi học trực tiếp",
    description: "Học theo nhịp riêng với video bài giảng, hoặc vào buổi live để hỏi đáp cùng giảng viên.",
    span: "md:col-span-4",
  },
  {
    icon: Route,
    title: "Lộ trình khóa học rõ ràng",
    description: "Mỗi khóa chia thành chương, bài học và bài tập theo thứ tự để bạn biết mình đang ở đâu.",
    span: "md:col-span-2",
  },
  {
    icon: BarChart3,
    title: "Theo dõi tiến độ",
    description: "Xem phần trăm hoàn thành, điểm số và thành tích của từng khóa học.",
    span: "md:col-span-3",
  },
  {
    icon: Smartphone,
    title: "Đồng hành cùng phụ huynh",
    description: "Theo dõi tiến độ và nhận thông báo ngay trên ứng dụng di động.",
    span: "md:col-span-3",
  },
];

export function FeatureBento() {
  return (
    <section
      id="tinh-nang"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24"
    >
      <ScrollReveal>
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-primary-600 dark:text-primary-400">
            Tính năng
          </p>
          <h2 className="text-h2 text-slate-900 dark:text-slate-50">
            Hệ sinh thái học tập toàn diện
          </h2>
          <p className="text-body mt-4 text-slate-600 dark:text-slate-300">
            Mọi công cụ bạn cần để tiến xa hơn trên con đường phát triển sự nghiệp.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-5 lg:gap-6">
        {FEATURES.map(({ icon: Icon, title, description, span }, i) => (
          <ScrollReveal key={title} delay={i * 60} className={span}>
            <Card className={cn("h-full min-h-[180px] rounded-3xl p-6 lg:p-8")}>
              <div className="mb-6 flex size-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="text-h3 text-slate-900 dark:text-slate-50">{title}</h3>
              <p className="text-body mt-3 max-w-[65ch] text-slate-600 dark:text-slate-300">
                {description}
              </p>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
