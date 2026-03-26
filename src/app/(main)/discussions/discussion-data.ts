export interface DiscussionComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  likes: number;
  replies: DiscussionComment[];
}

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
  comments: DiscussionComment[];
}

export const DISCUSSION_POSTS_STORAGE_KEY = "discussion-posts-v1";
export const DISCUSSION_POST_LIKED_STORAGE_KEY = "discussion-liked-posts-v1";
export const DISCUSSION_COMMENT_LIKED_STORAGE_KEY = "discussion-liked-comments-v1";

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
    comments: [
      {
        id: "c-react-1",
        author: "Pham Hoa",
        content: "Mình recommend thêm phần TypeScript sau khi học hooks cơ bản.",
        createdAt: "2026-03-21T08:30:00.000Z",
        likes: 6,
        replies: [
          {
            id: "c-react-1-r1",
            author: "Nguyen Minh",
            content: "Chuẩn luôn, mình sẽ bổ sung vào checklist.",
            createdAt: "2026-03-21T09:10:00.000Z",
            likes: 2,
            replies: [],
          },
        ],
      },
      {
        id: "c-react-2",
        author: "Le Thanh",
        content: "Làm project clone Trello mini khá hợp cho người mới React.",
        createdAt: "2026-03-21T12:00:00.000Z",
        likes: 4,
        replies: [],
      },
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
    comments: [
      {
        id: "c-motive-1",
        author: "Do Anh",
        content: "Mỗi ngày học 45 phút cố định + 15 phút note lại là giữ nhịp tốt lắm.",
        createdAt: "2026-03-19T07:15:00.000Z",
        likes: 8,
        replies: [],
      },
      {
        id: "c-motive-2",
        author: "Tran Thu",
        content: "Mình đang thử accountability buddy, thấy hiệu quả hơn học một mình.",
        createdAt: "2026-03-19T14:20:00.000Z",
        likes: 5,
        replies: [],
      },
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
    comments: [
      {
        id: "c-dashboard-1",
        author: "Minh Khoa",
        content: "UI ổn đó, nhưng phần card nên đồng nhất spacing dọc hơn chút.",
        createdAt: "2026-03-16T10:05:00.000Z",
        likes: 3,
        replies: [],
      },
    ],
  },
];

export function getDiscussionBySlug(slug: string): DiscussionPost | undefined {
  return discussionPosts.find((post) => post.slug === slug);
}

export function loadDiscussionPosts(): DiscussionPost[] {
  if (typeof window === "undefined") return discussionPosts;

  try {
    const raw = localStorage.getItem(DISCUSSION_POSTS_STORAGE_KEY);
    if (!raw) return discussionPosts;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return discussionPosts;

    return parsed as DiscussionPost[];
  } catch {
    return discussionPosts;
  }
}

export function saveDiscussionPosts(posts: DiscussionPost[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISCUSSION_POSTS_STORAGE_KEY, JSON.stringify(posts));
}
