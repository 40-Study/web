import { ScrollReveal } from "@/components/landing/scroll-reveal";

// Số liệu marketing lấy nguyên từ nội dung landing cũ; chưa có API thống kê.
const STATS = [
  { value: "10.000+", label: "Học viên đang học" },
  { value: "24/7", label: "Trợ giảng AI luôn sẵn sàng" },
  { value: "98%", label: "Đánh giá 5 sao" },
  { value: "2", label: "Nền tảng: web và di động" },
];

export function StatsStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24">
      <ScrollReveal>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-10 border-y border-slate-200 py-10 dark:border-slate-800 lg:grid-cols-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col-reverse text-center">
              <dt className="text-body-sm mt-2 text-slate-600 dark:text-slate-300">{label}</dt>
              <dd className="text-h1 tabular-nums text-slate-900 dark:text-slate-50">{value}</dd>
            </div>
          ))}
        </dl>
      </ScrollReveal>
    </section>
  );
}
