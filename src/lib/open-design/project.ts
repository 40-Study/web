import { z } from "zod";
const text = (max: number) => z.string().trim().min(1).max(max);
export const slideSchema = z.object({
  title: text(140),
  subtitle: z.string().max(320),
  bullets: z.array(text(240)).max(6),
  notes: z.string().max(3000),
  layout: z.enum(["cover", "content", "split", "summary"]),
});
export const questionSchema = z
  .object({
    question: text(1000),
    options: z.array(text(500)).length(4),
    correct_answer: z.number().int().min(0).max(3),
    explanation: text(1600),
  })
  .refine(
    (q) => new Set(q.options.map((v) => v.trim().toLocaleLowerCase())).size === 4,
    "Các lựa chọn phải khác nhau."
  );
export const artifactSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("slides"),
    title: text(160),
    slides: z.array(slideSchema).min(1).max(20),
  }),
  z.object({
    kind: z.literal("quiz"),
    title: text(160),
    questions: z.array(questionSchema).min(1).max(30),
  }),
]);
export type TeachingArtifact = z.infer<typeof artifactSchema>;
export type TeachingSlide = z.infer<typeof slideSchema>;
export type TeachingQuestion = z.infer<typeof questionSchema>;
export type OutputKind = TeachingArtifact["kind"];
export type SlideTheme = "blue" | "ink" | "forest";
export interface SourceDocument {
  id: string;
  name: string;
  text: string;
}
const versionSchema = z.object({
  id: z.string(),
  artifact: artifactSchema,
  prompt: z.string().max(6000),
  createdAt: z.string(),
});
export const projectSchema = z.object({
  skillID: z.string().optional(),
  documents: z
    .array(z.object({ id: z.string(), name: z.string().max(200), text: z.string().max(60000) }))
    .max(3)
    .default([]),
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(["user", "assistant"]),
        text: z.string().max(12000),
        files: z.array(z.string()).max(3).default([]),
        skills: z.array(z.string()).max(3).default([]),
      })
    )
    .max(80)
    .default([]),
  id: z.string(),
  title: text(160),
  kind: z.enum(["slides", "quiz"]),
  versions: z.array(versionSchema).max(10),
  activeVersion: z.string().nullable(),
  theme: z.enum(["blue", "ink", "forest"]),
});
export type DesignProject = z.infer<typeof projectSchema>;
const projectsSchema = z.array(projectSchema).max(8);
export const projectStorageKey = (userID: string) => `fortex:teacher-tools:v2:${userID}`;
export function loadProjects(userID: string): DesignProject[] {
  const stored = localStorage.getItem(projectStorageKey(userID));
  return stored ? projectsSchema.parse(JSON.parse(stored)) : [];
}
export function saveProjects(userID: string, projects: DesignProject[]): void {
  localStorage.setItem(projectStorageKey(userID), JSON.stringify(projectsSchema.parse(projects)));
}
export function newProject(kind: OutputKind = "slides"): DesignProject {
  return {
    id: crypto.randomUUID(),
    title: kind === "slides" ? "Bộ slide mới" : "Bài trắc nghiệm mới",
    kind,
    versions: [],
    activeVersion: null,
    theme: "blue",
    messages: [],
    documents: [],
  };
}
export function activeArtifact(project: DesignProject | null): TeachingArtifact | null {
  return project?.versions.find((v) => v.id === project.activeVersion)?.artifact ?? null;
}
export function gradeQuiz(questions: TeachingQuestion[], answers: Record<number, number>) {
  return questions.reduce(
    (score, q, index) => score + (answers[index] === q.correct_answer ? 1 : 0),
    0
  );
}
