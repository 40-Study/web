export interface DiscussionPost {
  slug: string;
  title: string;
  summary: string;
  category: "Lập trình" | "Thiết kế" | "Kinh nghiệm học" | "Dự án";
  author: string;
  createdAt: string;
  replies: number;
  likes: number;
  content: string[];
}

export const discussionPosts: DiscussionPost[] = [
  {
    slug: "lo-trinh-hoc-react-tu-con-so-0",
    title: "Lộ trình học React từ con số 0",
    summary:
      "Mình đang tổng hợp lộ trình học React cho người mới, gồm HTML/CSS, JavaScript, hooks và làm project thực tế.",
    category: "Lập trình",
    author: "Nguyen Minh",
    createdAt: "2026-03-20",
    replies: 18,
    likes: 42,
    content: [
      "Mình từng mất rất nhiều thời gian vì học React không có thứ tự rõ ràng.",
      "Lộ trình mình gợi ý: nắm vững JS cơ bản -> React fundamentals -> state management -> call API -> build project hoàn chỉnh.",
      "Anh em có tài liệu hoặc project phù hợp cho người mới thì chia sẻ thêm nhé.",
    ],
  },
  {
    slug: "cach-vuot-qua-giai-doan-mat-dong-luc",
    title: "Cách vượt qua giai đoạn mất động lực khi học",
    summary:
      "Khoảng 2 tuần nay mình bị chậm tiến độ. Mọi người có cách nào để quay lại nhịp học ổn định không?",
    category: "Kinh nghiệm học",
    author: "Tran Thu",
    createdAt: "2026-03-18",
    replies: 26,
    likes: 55,
    content: [
      "Mình nhận ra khi học một mình quá lâu thì rất dễ mất động lực.",
      "Hiện tại mình thử chia mục tiêu nhỏ theo ngày và report tiến độ với bạn học.",
      "Mọi người có tip nào để duy trì kỷ luật trong 2-3 tháng liên tục không?",
    ],
  },
  {
    slug: "showcase-du-an-dashboard-ca-nhan",
    title: "Showcase dự án Dashboard cá nhân",
    summary:
      "Mình vừa hoàn thành dashboard theo dõi chi tiêu và học tập. Nhờ mọi người góp ý về UI/UX và cấu trúc code.",
    category: "Dự án",
    author: "Le Quang",
    createdAt: "2026-03-15",
    replies: 11,
    likes: 31,
    content: [
      "Project gồm Next.js + Tailwind + biểu đồ thống kê theo tháng.",
      "Mình muốn cải thiện phần responsive và tốc độ tải khi có nhiều dữ liệu.",
      "Nếu bạn nào có checklist review dashboard thì mình xin tham khảo.",
    ],
  },
];

export function getDiscussionBySlug(slug: string): DiscussionPost | undefined {
  return discussionPosts.find((post) => post.slug === slug);
}
