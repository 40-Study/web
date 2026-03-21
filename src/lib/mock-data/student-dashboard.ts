/**
 * Mock data for Student Dashboard
 * Will be replaced with real API data later
 */

export interface CurrentCourse {
  id: string;
  title: string;
  highlightedText: string;
  chapter: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

export interface DeadlineTask {
  id: string;
  title: string;
  dueDate: string;
  daysLeft: number;
}

export interface LiveClass {
  id: string;
  title: string;
  mentor: string;
  participants: number;
  startTime: string;
}

export interface RecommendedCourse {
  id: string;
  title: string;
  thumbnail: string;
  price: number;
  students: number;
  likes: number;
  duration: string;
}

export const mockCurrentCourse: CurrentCourse = {
  id: "1",
  title: "Xây dựng ứng dụng Web Fullstack với",
  highlightedText: "React 19 & Go Fiber",
  chapter: "Chương 4: Tối ưu hóa hiệu năng và Deploy với Docker",
  progress: 65,
  totalLessons: 45,
  completedLessons: 29,
};

export const mockDeadlineTask: DeadlineTask = {
  id: "1",
  title: "Thực hành: Dockerize Go Fiber",
  dueDate: "24 Th05, 2024",
  daysLeft: 2,
};

export const mockLiveClass: LiveClass = {
  id: "2",
  title: "Chữa đề thi AWS Certified Solutions Architect",
  mentor: "Minh Hoàng",
  participants: 156,
  startTime: "20:00",
};

export const mockRecommendedCourses: RecommendedCourse[] = [
  {
    id: "1",
    title: "HTML CSS từ Zero đến Hero",
    thumbnail: "/courses/html-css.png",
    price: 1050000,
    students: 218477,
    likes: 117,
    duration: "29h5p",
  },
  {
    id: "2",
    title: "HTML CSS từ Zero đến Hero",
    thumbnail: "/courses/html-css.png",
    price: 1050000,
    students: 218477,
    likes: 117,
    duration: "29h5p",
  },
  {
    id: "3",
    title: "HTML CSS từ Zero đến Hero",
    thumbnail: "/courses/html-css.png",
    price: 1050000,
    students: 218477,
    likes: 117,
    duration: "29h5p",
  },
  {
    id: "4",
    title: "HTML CSS từ Zero đến Hero",
    thumbnail: "/courses/html-css.png",
    price: 1050000,
    students: 218477,
    likes: 117,
    duration: "29h5p",
  },
];
