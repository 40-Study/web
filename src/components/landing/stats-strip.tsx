import { AnimatedCounterOnScroll } from "@/components/landing/animated-counter-on-scroll";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

// QA-A-05: trước đây có "10.000+ học viên" và "98% đánh giá 5 sao" chép từ landing cũ, trong khi site chỉ có
// vài khoá, mỗi khoá 0-2 học viên. Backend chưa có API thống kê công khai nên chỉ giữ những điều ĐÚNG về sản
// phẩm (tính năng có thật: livestream, tra cứu chứng chỉ, web + di động), không có con số về người dùng.
// `target` là số đếm tới; mục `text` không phải số lượng nên giữ nguyên chữ.
const STATS: { label: string; target?: number; suffix?: string; text?: string }[] = [
  { text: "24/7", label: "Học bất cứ lúc nào, trên mọi thiết bị" },
  { text: "Trực tiếp", label: "Buổi học livestream cùng giảng viên" },
  { text: "Chứng chỉ", label: "Tra cứu công khai bằng mã số" },
  { target: 2, label: "Nền tảng: web và di động" },
];

export function StatsStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24">
      <ScrollReveal>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-10 border-y border-border py-10 lg:grid-cols-4">
          {STATS.map(({ label, target, suffix, text }) => (
            <div key={label} className="flex flex-col-reverse items-center text-center">
              <dt className="text-body-sm mt-2 text-muted-foreground">{label}</dt>
              <dd className="text-h1 tabular-nums text-foreground">
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
