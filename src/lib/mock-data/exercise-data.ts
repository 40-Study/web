export interface TestCase {
  id: string;
  input: string;
  expected: string;
}

export interface CodeExercise {
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  problemId: string;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  starterCode: Record<string, string>;
  testCases: TestCase[];
  supportedLanguages: string[];
}

// Keyed by lesson ID
export const mockExercises: Record<string, CodeExercise> = {
  l9: {
    id: "exercise-l9",
    title: "Tìm kiếm nhị phân",
    difficulty: "EASY",
    problemId: "40293",
    description: `## Mô tả

Cho một mảng số nguyên **nums** đã được sắp xếp tăng dần và một số nguyên **target**, hãy viết hàm tìm kiếm **target** trong **nums**.

Nếu **target** tồn tại, trả về chỉ số của nó. Ngược lại, trả về \`-1\`.

Bạn phải viết thuật toán có độ phức tạp thời gian **O(log n)**.`,
    examples: [
      {
        input: "nums = [-1,0,3,5,9,12], target = 9",
        output: "4",
        explanation: "9 tồn tại trong nums và có chỉ số là 4",
      },
      {
        input: "nums = [-1,0,3,5,9,12], target = 2",
        output: "-1",
        explanation: "2 không tồn tại trong nums nên trả về -1",
      },
    ],
    constraints: [
      "1 <= nums.length <= 10^4",
      "-10^4 < nums[i], target < 10^4",
      "Tất cả các phần tử trong nums là duy nhất",
      "nums được sắp xếp theo thứ tự tăng dần",
    ],
    starterCode: {
      go: `func search(nums []int, target int) int {
    // Viết code của bạn ở đây
    return -1
}`,
      javascript: `function search(nums, target) {
    // Viết code của bạn ở đây
    return -1;
}`,
      python: `def search(nums: list[int], target: int) -> int:
    # Viết code của bạn ở đây
    return -1`,
    },
    testCases: [
      {
        id: "tc1",
        input: "[-1,0,3,5,9,12]\n9",
        expected: "4",
      },
      {
        id: "tc2",
        input: "[-1,0,3,5,9,12]\n2",
        expected: "-1",
      },
      {
        id: "tc3",
        input: "[5]\n5",
        expected: "0",
      },
    ],
    supportedLanguages: ["go", "javascript", "python"],
  },
};

export function getExerciseByLessonId(lessonId: string): CodeExercise | undefined {
  return mockExercises[lessonId];
}
