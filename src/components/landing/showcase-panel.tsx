import { BookOpen, Flame, Home, MessageSquare, Trophy, Zap } from "lucide-react";

const NAV_ICONS = [Home, BookOpen, Trophy, MessageSquare];
const WEEK = [
  { d: "T2", done: true },
  { d: "T3", done: true },
  { d: "T4", done: true },
  { d: "T5", done: true },
  { d: "T6", done: false },
  { d: "T7", done: false },
  { d: "CN", done: false },
];

/**
 * Minh họa giao diện học viên bằng HTML tĩnh (không ảnh, không animation).
 * Tỉ lệ 16:10 từ md; ở 390 co theo nội dung và bỏ cột phụ.
 */
export function ShowcasePanel() {
  return (
    <div
      role="img"
      aria-label="Minh họa giao diện học tập của học viên: khóa học đang học, chuỗi ngày học và điểm kinh nghiệm"
      className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-raised dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex md:aspect-[16/10]">
        {/* Thanh điều hướng mini */}
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

        <div className="grid flex-1 content-center items-center gap-4 p-4 sm:p-6 md:grid-cols-3 md:gap-6 md:p-8">
          {/* Tiếp tục học */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-950 md:col-span-2 md:p-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tiếp tục học</p>
            <div className="mt-3 flex aspect-video items-end rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 p-4 md:p-5">
              <p className="font-heading text-xl font-semibold text-white md:text-2xl">
                Web với React
              </p>
            </div>
            <p className="mt-4 font-heading text-lg font-semibold text-slate-900 dark:text-slate-50 md:text-xl">
              Lập trình Web với React
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full w-[42%] rounded-full bg-primary-600 dark:bg-primary-400" />
              </div>
              <span className="text-xs font-medium tabular-nums text-slate-600 dark:text-slate-400">
                Bài 5/12 · 42%
              </span>
            </div>
          </div>

          {/* Streak + XP: ẩn ở 390 để panel gọn */}
          <div className="hidden flex-col gap-4 md:flex md:gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                <Flame className="h-4 w-4 text-streak dark:text-streak-light" />
                Chuỗi ngày học
              </div>
              <p className="mt-2 font-heading text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                4 ngày
              </p>
              <div className="mt-3 flex gap-1">
                {WEEK.map(({ d, done }) => (
                  <span
                    key={d}
                    className={
                      done
                        ? "flex h-7 flex-1 items-center justify-center rounded-md bg-primary-600 text-[10px] font-semibold text-white dark:bg-primary-400 dark:text-slate-950"
                        : "flex h-7 flex-1 items-center justify-center rounded-md bg-slate-100 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                <Zap className="h-4 w-4 text-xp dark:text-xp-light" />
                Điểm kinh nghiệm
              </div>
              <p className="mt-2 font-heading text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                1.240 XP
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full w-[68%] rounded-full bg-xp dark:bg-xp-light" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
