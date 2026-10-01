import { BookOpen, Flame, Home, MessageSquare, Trophy, Zap } from "lucide-react";
import { AnimatedBarChartOnScroll, type ChartBar } from "@/components/landing/animated-bar-chart-on-scroll";
import { AnimatedCounterOnScroll } from "@/components/landing/animated-counter-on-scroll";
import { AnimatedProgressBarOnScroll } from "@/components/landing/animated-progress-bar-on-scroll";
import { CodeEditorTyping } from "@/components/landing/code-editor-typing";

const NAV_ICONS = [Home, BookOpen, Trophy, MessageSquare];
// Phút học mỗi ngày trong tuần; T5 là hôm nay, T6 trở đi chưa có dữ liệu.
const WEEK: ChartBar[] = [
  { label: "T2", height: 55 },
  { label: "T3", height: 40 },
  { label: "T4", height: 75 },
  { label: "T5", height: 90, highlight: true },
  { label: "T6", height: 6 },
  { label: "T7", height: 6 },
  { label: "CN", height: 6 },
];

const CARD =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-950";

/**
 * Minh họa giao diện học viên: khung code gõ dần, thẻ "Tiếp tục học", biểu đồ tuần,
 * chuỗi ngày và XP. Mọi chuyển động chạy một lần khi cuộn tới; HTML server-render
 * luôn ở trạng thái cuối (không JS / reduced-motion vẫn thấy đủ nội dung).
 */
export function ShowcasePanel() {
  return (
    <div
      role="img"
      aria-label="Minh họa giao diện học tập của học viên: bài học lập trình React, khóa học đang học, thời gian học trong tuần, chuỗi ngày học và điểm kinh nghiệm"
      className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-raised dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex">
        <div className="hidden w-16 shrink-0 flex-col items-center gap-3 border-r border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-950 md:flex">
          {NAV_ICONS.map((Icon, i) => (
            <div
              key={i}
              className={
                i === 0
                  ? "flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300"
                  : "flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400"
              }
            >
              <Icon className="h-5 w-5" />
            </div>
          ))}
        </div>

        <div className="grid min-w-0 flex-1 items-stretch gap-4 p-4 sm:p-6 md:grid-cols-5 md:gap-6 md:p-8">
          <CodeEditorTyping className="min-w-0 md:col-span-3" />

          <div className="flex min-w-0 flex-col gap-4 md:col-span-2 md:gap-6">
            <div className={CARD}>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tiếp tục học</p>
              <div className="mt-3 flex aspect-[16/7] items-end rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 p-4">
                <p className="font-heading text-lg font-semibold text-white">Web với React</p>
              </div>
              <p className="mt-3 font-heading text-base font-semibold text-slate-900 dark:text-slate-50">
                Lập trình Web với React
              </p>
              <div className="mt-2 flex items-center gap-3">
                <AnimatedProgressBarOnScroll
                  percent={42}
                  className="flex-1 bg-slate-200 dark:bg-slate-800"
                  barClassName="bg-primary-600 dark:bg-primary-400"
                />
                <span className="text-xs font-medium tabular-nums text-slate-600 dark:text-slate-400">
                  Bài 5/12 · 42%
                </span>
              </div>
            </div>

            <div className={`${CARD} hidden flex-1 md:block`}>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Học trong tuần</p>
              <AnimatedBarChartOnScroll bars={WEEK} className="mt-3 h-24" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <Flame className="h-3.5 w-3.5 text-streak dark:text-streak-light" aria-hidden />
                    Chuỗi ngày
                  </div>
                  <p className="mt-1 font-heading text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                    <AnimatedCounterOnScroll target={4} suffix=" ngày" />
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <Zap className="h-3.5 w-3.5 text-xp dark:text-xp-light" aria-hidden />
                    Kinh nghiệm
                  </div>
                  <p className="mt-1 font-heading text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                    <AnimatedCounterOnScroll target={1240} suffix=" XP" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
