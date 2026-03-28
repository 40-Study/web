---
title: "Teacher assignment-management flow by course → lesson"
description: "Implement detailed teacher flow to browse all courses, pick lesson, and assign quiz/code tasks linked to lesson."
status: complete
priority: P1
effort: 10h
branch: test
tags: [teacher, assignments, lesson-linkage, frontend]
created: 2026-03-27
---

# Overview
Goal: satisfy flow "xem tất cả khóa học → chọn lesson cụ thể → giao bài tập (quiz, code...)" with minimal high-value scope, reusing existing teacher course/lesson data pattern.

## Scope (MVP)
- Rebuild `teacher/assignments` into 3-step flow:
  1) course list (all teacher courses)
  2) lesson list by selected course
  3) assignment creation + assignment list for selected lesson
- Support assignment types: `quiz`, `code`, `document`, `project`.
- Persist assignment data via current localStorage mock pattern (same style as `course-detail-data.ts`), no backend contract changes in this phase.
- Add deep-link entry from lesson detail and course detail to assignment creation context.

## Out of scope (YAGNI)
- Auto-grading engine.
- Student submission execution/runtime.
- Parent notification workflow automation.
- New backend endpoints.

## Phases
- [x] [Phase 1 — Data model + storage](./phase-01-data-model-and-storage.md)
- [x] [Phase 2 — Assignment page UX (course→lesson→assign)](./phase-02-teacher-assignments-page-flow.md)
- [x] [Phase 3 — Course/Lesson integration entry points](./phase-03-course-lesson-entry-integration.md)
- [x] [Phase 4 — Validation + handoff](./phase-04-validation-and-handoff.md)

## Key dependencies
- Existing course/lesson source: `src/app/(teacher)/teacher/courses/course-detail-data.ts`
- Existing pages:
  - `src/app/(teacher)/teacher/assignments/page.tsx`
  - `src/app/(teacher)/teacher/courses/[id]/page.tsx`
  - `src/app/(teacher)/teacher/courses/[id]/lessons/[lessonId]/page.tsx`

## Delivery checklist
- [ ] Data model includes assignment type + lesson linkage.
- [ ] Teacher can pick any course, then any lesson, then create assignment.
- [ ] Assignment appears immediately in lesson-level list.
- [ ] Deep link from lesson page opens assignment page with preselected course/lesson.
- [ ] Lint/build pass.
