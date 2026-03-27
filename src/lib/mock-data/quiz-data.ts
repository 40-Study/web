/**
 * Mock quiz data for the course learning platform.
 * Keyed by lesson ID. Will be replaced with real API data later.
 */

export interface QuizQuestion {
  id: string;
  /** Question text — may contain inline code (e.g. `useCallback`) */
  question: string;
  options: { label: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  totalQuestions: number;
  /** Time limit in seconds (e.g. 900 = 15 minutes) */
  timeLimit: number;
  questions: QuizQuestion[];
}

// ---------------------------------------------------------------------------
// Quiz questions
// ---------------------------------------------------------------------------

const reactHooksQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Hook `useState` trả về giá trị gì?',
    options: [
      { label: 'A', text: 'Một object có thuộc tính state và setState' },
      { label: 'B', text: 'Một mảng gồm giá trị state hiện tại và hàm cập nhật nó' },
      { label: 'C', text: 'Chỉ giá trị state hiện tại' },
      { label: 'D', text: 'Một Promise chứa giá trị state' },
    ],
    correctAnswer: 'B',
    explanation:
      '`useState` trả về một tuple `[state, setState]`. Phần tử đầu là giá trị hiện tại, phần tử thứ hai là hàm dùng để cập nhật state và kích hoạt re-render.',
  },
  {
    id: 'q2',
    question:
      'Khi nào nên dùng `useCallback` thay vì khai báo hàm trực tiếp trong component?',
    options: [
      { label: 'A', text: 'Luôn luôn, vì `useCallback` nhanh hơn' },
      {
        label: 'B',
        text: 'Khi hàm được truyền làm prop cho child component đã được memo hoặc dùng trong dependency array của hook khác',
      },
      { label: 'C', text: 'Chỉ khi hàm bất đồng bộ (async)' },
      { label: 'D', text: 'Khi hàm cần truy cập Redux store' },
    ],
    correctAnswer: 'B',
    explanation:
      '`useCallback` memoize tham chiếu hàm giữa các lần render. Nó có ý nghĩa khi hàm được truyền vào `React.memo` child hoặc là dependency của `useEffect`/`useMemo`, tránh re-render hoặc re-run không cần thiết.',
  },
  {
    id: 'q3',
    question:
      'Dependency array `[]` trong `useEffect` có nghĩa là gì?',
    options: [
      { label: 'A', text: 'Effect chạy sau mỗi lần render' },
      { label: 'B', text: 'Effect chạy một lần sau lần mount đầu tiên' },
      { label: 'C', text: 'Effect không bao giờ chạy' },
      { label: 'D', text: 'Effect chạy khi component unmount' },
    ],
    correctAnswer: 'B',
    explanation:
      'Truyền mảng rỗng `[]` vào `useEffect` khiến effect chỉ chạy một lần sau khi component mount, tương tự `componentDidMount` trong class component. Cleanup function (nếu có) sẽ chạy khi component unmount.',
  },
  {
    id: 'q4',
    question:
      'Trong Go Fiber, middleware nào được dùng để đọc giá trị từ request body dạng JSON?',
    options: [
      { label: 'A', text: 'fiber.Static()' },
      { label: 'B', text: 'c.BodyParser(&struct{})' },
      { label: 'C', text: 'c.QueryParser(&struct{})' },
      { label: 'D', text: 'fiber.Logger()' },
    ],
    correctAnswer: 'B',
    explanation:
      '`c.BodyParser(&target)` trong Fiber tự động giải mã request body (JSON, XML, form-data) vào struct chỉ định. Đây là cách tiêu chuẩn để đọc payload từ POST/PUT request.',
  },
  {
    id: 'q5',
    question:
      'Trong Go Fiber, `c.Locals("key", value)` dùng để làm gì?',
    options: [
      { label: 'A', text: 'Lưu giá trị vào session của người dùng' },
      { label: 'B', text: 'Đặt cookie trên response' },
      { label: 'C', text: 'Chia sẻ dữ liệu giữa các middleware trong cùng một request context' },
      { label: 'D', text: 'Cache dữ liệu ở tầng server' },
    ],
    correctAnswer: 'C',
    explanation:
      '`c.Locals` cho phép middleware gắn dữ liệu vào request context (ví dụ: thông tin user sau khi xác thực JWT) để các handler hoặc middleware tiếp theo đọc bằng `c.Locals("key")`.',
  },
];

// ---------------------------------------------------------------------------
// Quiz definitions
// ---------------------------------------------------------------------------

const reactHooksFundamentalsQuiz: Quiz = {
  id: 'quiz-l7',
  title: 'React Hooks Fundamentals',
  totalQuestions: reactHooksQuestions.length,
  timeLimit: 900, // 15 minutes
  questions: reactHooksQuestions,
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/** Map of lesson ID → Quiz. Add more entries as lessons are created. */
export const mockQuizzes: Record<string, Quiz> = {
  l7: reactHooksFundamentalsQuiz,
};

/** Returns the quiz associated with a lesson, or undefined if none exists. */
export function getQuizByLessonId(lessonId: string): Quiz | undefined {
  return mockQuizzes[lessonId];
}
