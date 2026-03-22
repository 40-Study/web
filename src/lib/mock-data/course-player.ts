/**
 * Mock data for Course Player page
 * Will be replaced with real API data later
 */

export interface PlayerLesson {
  id: string;
  title: string;
  duration: string; // e.g. "06:30"
  type: "video" | "quiz" | "exercise" | "reading";
  completed: boolean;
  locked: boolean;
  videoUrl?: string;
}

export interface PlayerChapter {
  id: string;
  title: string;
  lessons: PlayerLesson[];
}

export interface PlayerCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  instructor: {
    name: string;
    avatar?: string;
    title: string;
    rating: number;
    studentCount: number;
    courseCount: number;
  };
  rating: number;
  reviewCount: number;
  level: string;
  language: string;
  chapters: PlayerChapter[];
  resources: PlayerResource[];
  reviews: PlayerReview[];
}

export interface PlayerResource {
  id: string;
  title: string;
  type: "pdf" | "zip" | "link";
  url: string;
  size?: string;
}

export interface PlayerReview {
  id: string;
  user: { name: string; avatar?: string };
  rating: number;
  content: string;
  createdAt: string;
}

export const mockPlayerCourse: PlayerCourse = {
  id: "1",
  title: "Xây dựng ứng dụng Web Fullstack với React 19 & Go Fiber",
  slug: "fullstack-react-go-fiber",
  description:
    "Khóa học toàn diện về phát triển web fullstack sử dụng React 19 và Go Fiber. Bạn sẽ học cách xây dựng ứng dụng web hiện đại từ frontend đến backend.",
  instructor: {
    name: "Nguyễn Văn Minh",
    title: "Senior Fullstack Developer",
    rating: 4.9,
    studentCount: 12500,
    courseCount: 8,
  },
  rating: 4.8,
  reviewCount: 342,
  level: "Trung cấp",
  language: "Tiếng Việt",
  chapters: [
    {
      id: "ch1",
      title: "Giới thiệu Golang",
      lessons: [
        {
          id: "l1",
          title: "Cài đặt môi trường Go",
          duration: "06:30",
          type: "video",
          completed: true,
          locked: false,
          videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        },
        {
          id: "l2",
          title: "Hello World với Go",
          duration: "10:00",
          type: "video",
          completed: true,
          locked: false,
        },
        {
          id: "l3",
          title: "Kiểu dữ liệu cơ bản",
          duration: "15:20",
          type: "video",
          completed: false,
          locked: false,
        },
      ],
    },
    {
      id: "ch2",
      title: "Go Fiber Backend",
      lessons: [
        {
          id: "l4",
          title: "Giới thiệu Go Fiber Framework",
          duration: "18:30",
          type: "video",
          completed: false,
          locked: false,
          videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        },
        {
          id: "l5",
          title: "Routing trong Fiber",
          duration: "22:15",
          type: "video",
          completed: false,
          locked: false,
        },
        {
          id: "l6",
          title: "Middleware & Authentication",
          duration: "35:00",
          type: "video",
          completed: false,
          locked: true,
        },
        {
          id: "l7",
          title: "Kiểm tra kiến thức chương 2",
          duration: "10:00",
          type: "quiz",
          completed: false,
          locked: true,
        },
      ],
    },
    {
      id: "ch3",
      title: "React 19 Frontend",
      lessons: [
        {
          id: "l8",
          title: "Server Components trong React 19",
          duration: "25:00",
          type: "video",
          completed: false,
          locked: true,
        },
        {
          id: "l9",
          title: "Bài tập: Xây dựng Todo App",
          duration: "45:00",
          type: "exercise",
          completed: false,
          locked: true,
        },
      ],
    },
  ],
  resources: [
    { id: "r1", title: "Slide bài giảng chương 1", type: "pdf", url: "#", size: "2.4 MB" },
    { id: "r2", title: "Source code mẫu", type: "zip", url: "#", size: "1.1 MB" },
    { id: "r3", title: "Tài liệu tham khảo Go", type: "link", url: "https://go.dev/doc/" },
  ],
  reviews: [
    {
      id: "rv1",
      user: { name: "Trần Thị Mai" },
      rating: 5,
      content: "Khóa học rất hay, giảng viên giải thích rõ ràng và dễ hiểu. Tôi đã học được rất nhiều!",
      createdAt: "2024-05-10",
    },
    {
      id: "rv2",
      user: { name: "Lê Văn Hùng" },
      rating: 4,
      content: "Nội dung phong phú, có nhiều bài tập thực hành. Tuy nhiên phần deploy hơi ngắn.",
      createdAt: "2024-04-22",
    },
  ],
};

/** Get lesson by ID from course */
export function getLessonById(course: PlayerCourse, lessonId: string): PlayerLesson | undefined {
  for (const chapter of course.chapters) {
    const lesson = chapter.lessons.find((l) => l.id === lessonId);
    if (lesson) return lesson;
  }
  return undefined;
}

/** Get adjacent lessons (prev/next) */
export function getAdjacentLessons(
  course: PlayerCourse,
  lessonId: string
): { prev?: PlayerLesson; next?: PlayerLesson } {
  const allLessons = course.chapters.flatMap((ch) => ch.lessons);
  const idx = allLessons.findIndex((l) => l.id === lessonId);
  return {
    prev: idx > 0 ? allLessons[idx - 1] : undefined,
    next: idx < allLessons.length - 1 ? allLessons[idx + 1] : undefined,
  };
}
