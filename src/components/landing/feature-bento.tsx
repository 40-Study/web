import type { LucideIcon } from "lucide-react";
import { BarChart3, Bot, Route, Smartphone } from "lucide-react";
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
    icon: Bot,
    title: "Trợ giảng ảo AI 24/7",
    description: "Giải đáp thắc mắc, sửa lỗi code và gợi ý hướng đi ngay khi bạn cần.",
    span: "md:col-span-4",
  },
  {
    icon: Route,
    title: "Lộ trình thích ứng",
    description: "Nội dung tự điều chỉnh theo kết quả của từng bài kiểm tra.",
    span: "md:col-span-2",
  },
  {
    icon: BarChart3,
    title: "Tối ưu nhịp độ học",
    description: "Phân tích dữ liệu học tập để gợi ý phù hợp với khả năng của bạn.",
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
        <div className="mx-auto mb-12 max-w-2xl text-center">
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
            <Card className={cn("h-full rounded-3xl p-6 lg:p-8")}>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
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
