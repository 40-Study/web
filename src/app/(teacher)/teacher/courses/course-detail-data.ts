export type TeacherCourseStatus = "published" | "draft";
export type LessonType = "video" | "quiz" | "sandbox" | "document";

export interface TeacherCourseLesson {
  id: string;
  title: string;
  type: LessonType;
  summary: string;
  content: string;
  status: "published" | "draft";
  duration?: string;
  questionCount?: number;
  fileSize?: string;
}

export interface TeacherCourseChapter {
  id: string;
  title: string;
  description: string;
  learningGoal: string;
  lessons: TeacherCourseLesson[];
}

export interface TeacherCourseDetail {
  id: string;
  title: string;
  status: TeacherCourseStatus;
  chapters: TeacherCourseChapter[];
}

export interface TeacherLessonComment {
  id: string;
  studentName: string;
  content: string;
  createdAt: string;
  likes: number;
}

const COURSE_STORAGE_PREFIX = "teacher-course-detail-v1";
const LESSON_COMMENT_STORAGE_PREFIX = "teacher-lesson-comments-v1";

export const TEACHER_COURSE_DETAIL_MAP: Record<string, TeacherCourseDetail> = {
  "1": {
    id: "1",
    title: "Lập trình ReactJS cho người mới bắt đầu",
    status: "published",
    chapters: [
      {
        id: "c1",
        title: "Chương 1: Nhập môn React & Component",
        description: "Giới thiệu React, component-based thinking và setup môi trường.",
        learningGoal: "Nắm được cấu trúc component và vòng đời render cơ bản.",
        lessons: [
          {
            id: "l1",
            title: "Giới thiệu về React Component",
            type: "video",
            summary: "Khái niệm component, props và cách chia UI thành block.",
            content: "Bài học trình bày tư duy component-first, cách truyền props và tổ chức file component.",
            status: "published",
            duration: "12:45",
          },
          {
            id: "l2",
            title: "Thực hành: Tạo Component đầu tiên",
            type: "sandbox",
            summary: "Tạo giao diện profile card với state đơn giản.",
            content: "Học viên thực hành tạo component, bind dữ liệu và chỉnh sửa giao diện với props.",
            status: "published",
          },
        ],
      },
      {
        id: "c2",
        title: "Chương 2: JSX và Props",
        description: "Làm việc với JSX, conditional rendering và props nâng cao.",
        learningGoal: "Viết JSX sạch, tái sử dụng component qua props.",
        lessons: [
          {
            id: "l3",
            title: "Cú pháp JSX và Rendering",
            type: "video",
            summary: "Quy tắc JSX và các pattern render list/condition.",
            content: "Bài học tập trung vào JSX expression, key khi render list và pattern component hóa.",
            status: "published",
            duration: "18:20",
          },
          {
            id: "l4",
            title: "Trắc nghiệm kiến thức JSX",
            type: "quiz",
            summary: "Kiểm tra kiến thức JSX và props qua 10 câu hỏi.",
            content: "Học viên làm quiz để củng cố kiến thức JSX, conditional render và props.",
            status: "published",
            questionCount: 10,
          },
          {
            id: "l5",
            title: "Tài liệu: Cheat sheet Props & State",
            type: "document",
            summary: "Tổng hợp nhanh cú pháp props/state dùng hằng ngày.",
            content: "Tài liệu PDF tóm tắt cú pháp và best-practice khi làm component stateful.",
            status: "published",
            fileSize: "1.2 MB",
          },
        ],
      },
    ],
  },
};

const TEACHER_LESSON_COMMENT_MAP: Record<string, TeacherLessonComment[]> = {
  "1:l1": [
    {
      id: "cm-1",
      studentName: "Nguyễn Minh Anh",
      content: "Phần props em đã hiểu hơn, nhưng khi nào nên tách component nhỏ hơn ạ?",
      createdAt: "2026-03-24 19:30",
      likes: 3,
    },
    {
      id: "cm-2",
      studentName: "Trần Gia Bảo",
      content: "Video dễ hiểu, em đã làm lại bài thực hành profile card rồi ạ.",
      createdAt: "2026-03-25 08:10",
      likes: 2,
    },
  ],
};

export function getTeacherCourseDetail(courseId: string): TeacherCourseDetail {
  return (
    TEACHER_COURSE_DETAIL_MAP[courseId] ?? {
      id: courseId,
      title: `Khóa học #${courseId}`,
      status: "draft",
      chapters: [],
    }
  );
}

export function getTeacherCourseStorageKey(courseId: string) {
  return `${COURSE_STORAGE_PREFIX}:${courseId}`;
}

export function getTeacherLessonCommentsStorageKey(courseId: string, lessonId: string) {
  return `${LESSON_COMMENT_STORAGE_PREFIX}:${courseId}:${lessonId}`;
}

function isTeacherCourseLesson(value: unknown): value is TeacherCourseLesson {
  if (!value || typeof value !== "object") return false;
  const lesson = value as TeacherCourseLesson;
  const validType = lesson.type === "video" || lesson.type === "quiz" || lesson.type === "sandbox" || lesson.type === "document";
  const validStatus = lesson.status === "published" || lesson.status === "draft";
  return (
    typeof lesson.id === "string" &&
    typeof lesson.title === "string" &&
    validType &&
    typeof lesson.summary === "string" &&
    typeof lesson.content === "string" &&
    validStatus &&
    (lesson.duration === undefined || typeof lesson.duration === "string") &&
    (lesson.questionCount === undefined || typeof lesson.questionCount === "number") &&
    (lesson.fileSize === undefined || typeof lesson.fileSize === "string")
  );
}

function isTeacherCourseChapter(value: unknown): value is TeacherCourseChapter {
  if (!value || typeof value !== "object") return false;
  const chapter = value as TeacherCourseChapter;
  return (
    typeof chapter.id === "string" &&
    typeof chapter.title === "string" &&
    typeof chapter.description === "string" &&
    typeof chapter.learningGoal === "string" &&
    Array.isArray(chapter.lessons) &&
    chapter.lessons.every(isTeacherCourseLesson)
  );
}

function isTeacherLessonComment(value: unknown): value is TeacherLessonComment {
  if (!value || typeof value !== "object") return false;
  const comment = value as TeacherLessonComment;
  return (
    typeof comment.id === "string" &&
    typeof comment.studentName === "string" &&
    typeof comment.content === "string" &&
    typeof comment.createdAt === "string" &&
    typeof comment.likes === "number"
  );
}

export function loadTeacherCourseChapters(courseId: string): TeacherCourseChapter[] {
  const fallback = getTeacherCourseDetail(courseId).chapters;
  if (typeof window === "undefined") return fallback;

  try {
    const raw = localStorage.getItem(getTeacherCourseStorageKey(courseId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isTeacherCourseChapter)) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export function saveTeacherCourseChapters(courseId: string, chapters: TeacherCourseChapter[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getTeacherCourseStorageKey(courseId), JSON.stringify(chapters));
  } catch {
    return;
  }
}

export function loadTeacherLessonComments(courseId: string, lessonId: string): TeacherLessonComment[] {
  const fallback = TEACHER_LESSON_COMMENT_MAP[`${courseId}:${lessonId}`] ?? [];
  if (typeof window === "undefined") return fallback;

  try {
    const raw = localStorage.getItem(getTeacherLessonCommentsStorageKey(courseId, lessonId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isTeacherLessonComment)) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export function saveTeacherLessonComments(courseId: string, lessonId: string, comments: TeacherLessonComment[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getTeacherLessonCommentsStorageKey(courseId, lessonId), JSON.stringify(comments));
  } catch {
    return;
  }
}

export function findLessonInChapters(chapters: TeacherCourseChapter[], lessonId: string) {
  for (const chapter of chapters) {
    const lesson = chapter.lessons.find((item) => item.id === lessonId);
    if (lesson) return { chapter, lesson };
  }
  return null;
}
