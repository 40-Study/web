import { z } from "zod";
export const teachingSkillSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  description: z.string().max(200),
  output: z.enum(["slides", "quiz"]),
  instructions: z.string().trim().min(1).max(8000),
});
export type TeachingSkill = z.infer<typeof teachingSkillSchema>;
export const BUILTIN_SKILLS: TeachingSkill[] = [
  {
    id: "slides",
    name: "Tạo slide",
    description: "Biến tài liệu thành bài giảng có bố cục và ghi chú.",
    output: "slides",
    instructions:
      "Thiết kế slide bài giảng cô đọng: mở đầu, mục tiêu, nội dung chính, ví dụ và tổng kết. Mỗi slide chỉ một thông điệp; có ghi chú giảng viên.",
  },
  {
    id: "quiz",
    name: "Tạo trắc nghiệm",
    description: "Form câu hỏi có đáp án đúng, giải thích và chấm thử.",
    output: "quiz",
    instructions:
      "Tạo câu hỏi trắc nghiệm bám sát tài liệu. Mỗi câu có 4 phương án khác nhau, duy nhất 1 đáp án đúng; tự giải và kiểm tra đáp án, giải thích các bước.",
  },
];
const listSchema = z.array(teachingSkillSchema).max(20);
export const skillStorageKey = (userID: string) => `fortex:ai-skills:v1:${userID}`;
export function loadCustomSkills(userID: string) {
  const raw = localStorage.getItem(skillStorageKey(userID));
  return raw ? listSchema.parse(JSON.parse(raw)) : [];
}
export function saveCustomSkills(userID: string, skills: TeachingSkill[]) {
  localStorage.setItem(skillStorageKey(userID), JSON.stringify(listSchema.parse(skills)));
}
