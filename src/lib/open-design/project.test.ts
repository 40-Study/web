import { beforeEach, describe, expect, it } from "vitest";
import {
  activeArtifact,
  artifactSchema,
  gradeQuiz,
  loadProjects,
  newProject,
  projectStorageKey,
  saveProjects,
  type TeachingQuestion,
} from "./project";
const question: TeachingQuestion = {
  question: "2 + 2 = ?",
  options: ["3", "4", "5", "6"],
  correct_answer: 1,
  explanation: "Hai cộng hai bằng bốn.",
};
describe("teacher tools artifacts", () => {
  beforeEach(() => localStorage.clear());
  it("validates one correct option and rejects duplicates", () => {
    const valid = { kind: "quiz", title: "Quiz", questions: [question] };
    expect(artifactSchema.safeParse(valid).success).toBe(true);
    expect(
      artifactSchema.safeParse({ ...valid, questions: [{ ...question, correct_answer: 4 }] })
        .success
    ).toBe(false);
    expect(
      artifactSchema.safeParse({
        ...valid,
        questions: [{ ...question, options: ["A", "A", "B", "C"] }],
      }).success
    ).toBe(false);
  });
  it("grades selected answers locally", () => {
    expect(gradeQuiz([question, question], { 0: 1, 1: 0 })).toBe(1);
    expect(gradeQuiz([question], { 0: 1 })).toBe(1);
    expect(gradeQuiz([question], {})).toBe(0);
  });
  it("isolates teacher drafts and retains selected version", () => {
    const p = newProject("quiz");
    p.versions = [
      {
        id: "v1",
        artifact: { kind: "quiz", title: "Quiz", questions: [question] },
        prompt: "Create",
        createdAt: "today",
      },
    ];
    p.activeVersion = "v1";
    saveProjects("teacher", [p]);
    expect(activeArtifact(loadProjects("teacher")[0])?.kind).toBe("quiz");
    expect(loadProjects("other")).toEqual([]);
    localStorage.setItem(projectStorageKey("teacher"), "corrupt");
    expect(() => loadProjects("teacher")).toThrow();
  });
});
