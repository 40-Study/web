/**
 * Mock data for My Assignments page
 * Will be replaced with real API data later
 */

export type AssignmentType = "QUIZ" | "SANDBOX" | "THỰC HÀNH" | "NỘP FILE";
export type AssignmentStatus = "pending" | "completed" | "overdue";

export interface MyAssignment {
  id: string;
  title: string;
  courseName: string;
  type: AssignmentType;
  status: AssignmentStatus;
  deadline?: string; // e.g. "12 giờ tới" or date string
  score?: string; // e.g. "9.5/10"
  submittedAt?: string; // date string
  courseSlug: string;
  lessonId: string;
}

export const mockMyAssignments: MyAssignment[] = [
  {
    id: "a1",
    title: "Sơ đồ Use Case: Hệ thống quản lý thư viện",
    courseName: "Phân tích & Thiết kế HT",
    type: "NỘP FILE",
    status: "pending",
    deadline: "12 giờ tới",
    courseSlug: "phan-tich-thiet-ke-ht",
    lessonId: "lesson-use-case",
  },
  {
    id: "a2",
    title: "Trắc nghiệm: Kiến trúc Microservices",
    courseName: "Cloud Computing",
    type: "QUIZ",
    status: "pending",
    deadline: "May 24, 2024",
    courseSlug: "cloud-computing",
    lessonId: "lesson-microservices",
  },
  {
    id: "a3",
    title: "Thực hành: Dockerize ứng dụng Node.js",
    courseName: "Cloud Computing",
    type: "SANDBOX",
    status: "completed",
    submittedAt: "May 20, 2024",
    courseSlug: "cloud-computing",
    lessonId: "lesson-docker-nodejs",
  },
  {
    id: "a4",
    title: "Thuật toán: Binary Search Tree",
    courseName: "Data Structures & Algorithms",
    type: "THỰC HÀNH",
    status: "overdue",
    courseSlug: "data-structures-algorithms",
    lessonId: "lesson-bst",
  },
  {
    id: "a5",
    title: "Kiểm tra: React Hooks & State",
    courseName: "Frontend Development",
    type: "QUIZ",
    status: "completed",
    score: "9.5/10",
    submittedAt: "May 18, 2024",
    courseSlug: "frontend-development",
    lessonId: "lesson-react-hooks",
  },
];
