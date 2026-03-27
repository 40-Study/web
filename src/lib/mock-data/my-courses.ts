/**
 * Mock data for My Courses page
 * Will be replaced with real API data later
 */

export interface TodayStats {
  timeSpent: string;
  progress: number;
}

export interface FeaturedCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  tags: string[];
  progress: number;
  completedLessons: number;
  totalLessons: number;
  nextLesson: string;
}

export interface EnrolledCourse {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
  progress: number;
  category: string;
}

export interface OtherLearningCourse {
  id: string;
  slug: string;
  title: string;
  progress: number;
  category: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  color: string;
}

export const mockTodayStats: TodayStats = {
  timeSpent: "1h 45m",
  progress: 72,
};

export const mockFeaturedCourse: FeaturedCourse = {
  id: "1",
  slug: "reactjs-nextjs-web-hien-dai",
  title: "Xây dựng ứng dụng Web Fullstack với React 19 & Go Fiber",
  description: "Học cách kết nối React và Go Fiber để xây dựng ứng dụng hoàn chỉnh.",
  thumbnail: "/courses/fullstack.jpg",
  tags: ["BACKEND", "CHƯƠNG 4: REST API"],
  progress: 35,
  completedLessons: 16,
  totalLessons: 45,
  nextLesson: "Xử lý Middleware trong Go Fiber",
};

export const mockEnrolledCourses: EnrolledCourse[] = [
  {
    id: "2",
    slug: "html-css-zero-to-hero",
    title: "HTML CSS từ Zero đến Hero",
    thumbnail: "/courses/html-css.png",
    progress: 100,
    category: "FRONTEND",
  },
  {
    id: "3",
    slug: "nodejs-express-rest-api",
    title: "Node.js & Express - Xây dựng REST API chuyên nghiệp",
    thumbnail: "/courses/javascript.png",
    progress: 68,
    category: "BACKEND",
  },
  {
    id: "4",
    slug: "docker-kubernetes-devops",
    title: "Docker & Kubernetes thực chiến",
    thumbnail: "/courses/docker.png",
    progress: 20,
    category: "DEVOPS",
  },
  {
    id: "5",
    slug: "python-ai-machine-learning",
    title: "Python cho AI & Machine Learning",
    thumbnail: "/courses/react.png",
    progress: 45,
    category: "AI/ML",
  },
  {
    id: "6",
    slug: "postgresql-mongodb-database",
    title: "PostgreSQL & MongoDB - Quản lý cơ sở dữ liệu",
    thumbnail: "/courses/postgres.png",
    progress: 55,
    category: "DATABASE",
  },
];

export const mockOtherLearning: OtherLearningCourse[] = [
  {
    id: "8",
    slug: "html-css-zero-to-hero",
    title: "HTML CSS từ Zero đến Hero",
    progress: 30,
    category: "FRONTEND",
  },
  {
    id: "9",
    slug: "nodejs-express-rest-api",
    title: "Node.js Express REST API",
    progress: 15,
    category: "BACKEND",
  },
  {
    id: "10",
    slug: "docker-kubernetes-devops",
    title: "Docker & Kubernetes DevOps",
    progress: 50,
    category: "CLOUD",
  },
];

export const mockAchievements: Achievement[] = [
  {
    id: "1",
    title: "Khởi đầu hoàn hảo",
    description: "Hoàn thành khóa học đầu tiên",
    icon: "🏆",
    earnedAt: "01/03/2024",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    id: "2",
    title: "7 ngày liên tiếp",
    description: "Học liên tục 7 ngày",
    icon: "🔥",
    earnedAt: "10/03/2024",
    color: "bg-orange-100 text-orange-700",
  },
  {
    id: "3",
    title: "Chiến binh Backend",
    description: "Hoàn thành 5 bài về Backend",
    icon: "⚡",
    earnedAt: "15/03/2024",
    color: "bg-purple-100 text-purple-700",
  },
];
