export const HOME_WIDGETS = [
  {
    id: "continue",
    title: "Tiếp tục học",
    description: "Quay lại khoá học gần đây nhất.",
    width: "lg:col-span-6",
  },
  {
    id: "activity",
    title: "Hoạt động học tập",
    description: "Nhìn lại hoạt động trong 7 ngày gần đây.",
    width: "lg:col-span-6",
  },
  {
    id: "overview",
    title: "Tổng quan học tập",
    description: "Khoá học, bài học và thành tích của bạn.",
    width: "lg:col-span-4",
  },
  {
    id: "streak",
    title: "Chuỗi ngày học",
    description: "Giữ nhịp học tập mỗi ngày.",
    width: "lg:col-span-4",
  },
  {
    id: "xp",
    title: "Điểm kinh nghiệm",
    description: "Theo dõi XP và tiến độ lên cấp.",
    width: "lg:col-span-4",
  },
  {
    id: "schedule",
    title: "Lịch học hôm nay",
    description: "Các buổi học và thời gian trong ngày.",
    width: "lg:col-span-6",
  },
  {
    id: "shortcuts",
    title: "Truy cập nhanh",
    description: "Mở các không gian học tập quen thuộc.",
    width: "lg:col-span-6",
  },
  {
    id: "courses",
    title: "Khoá học của bạn",
    description: "Tiến độ của các khoá học đã đăng ký.",
    width: "lg:col-span-6",
  },
  {
    id: "recommended",
    title: "Khám phá thêm",
    description: "Các khoá học nổi bật dành cho bạn.",
    width: "lg:col-span-6",
  },
] as const;

export type HomeWidgetId = (typeof HOME_WIDGETS)[number]["id"];
export const DEFAULT_HOME_LAYOUT: HomeWidgetId[] = HOME_WIDGETS.map((widget) => widget.id);

/** Ignore unknown IDs and duplicates from older or invalid local preferences. */
export function readHomeLayout(value: string | null): HomeWidgetId[] {
  if (!value) return [...DEFAULT_HOME_LAYOUT];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [...DEFAULT_HOME_LAYOUT];
    const valid = parsed.filter((id): id is HomeWidgetId =>
      HOME_WIDGETS.some((widget) => widget.id === id)
    );
    return [...new Set(valid)];
  } catch {
    return [...DEFAULT_HOME_LAYOUT];
  }
}
