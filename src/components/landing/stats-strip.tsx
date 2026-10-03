import { AnimatedCounterOnScroll } from "@/components/landing/animated-counter-on-scroll";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

// Số liệu marketing lấy nguyên từ nội dung landing cũ; chưa có API thống kê.
// `target` là số đếm tới; "24/7" không phải số lượng nên giữ nguyên chữ.
const STATS: { label: string; target?: number; suffix?: string; text?: string }[] = [
  { target: 10000, suffix: "+", label: "Học viên đang học" },
  { text: "24/7", label: "Học bất cứ lúc nào, trên mọi thiết bị" },
  { target: 98, suffix: "%", label: "Đánh giá 5 sao" },
  { target: 2, label: "Nền tảng: web và di động" },
];

export function StatsStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24">
      <ScrollReveal>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-10 border-y border-slate-200 py-10 dark:border-slate-800 lg:grid-cols-4">
          {STATS.map(({ label, target, suffix, text }) => (
            <div key={label} className="flex flex-col-reverse items-center text-center">
              <dt className="text-body-sm mt-2 text-slate-600 dark:text-slate-300">{label}</dt>
              <dd className="text-h1 tabular-nums text-slate-900 dark:text-slate-50">
                {target === undefined ? (
                  text
                ) : (
                  <AnimatedCounterOnScroll target={target} suffix={suffix} />
                )}
              </dd>
            </div>
          ))}
        </dl>
      </ScrollReveal>
    </section>
  );
}
