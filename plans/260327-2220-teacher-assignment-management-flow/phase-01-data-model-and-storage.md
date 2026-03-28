# Phase 01 — Data model + storage

## Context Links
- `src/app/(teacher)/teacher/courses/course-detail-data.ts`
- `src/app/(teacher)/teacher/assignments/page.tsx`
- `src/app/(teacher)/teacher/courses/[id]/page.tsx`
- `src/app/(teacher)/teacher/courses/[id]/lessons/[lessonId]/page.tsx`

## Overview
- Priority: P1
- Status: pending
- Brief: add assignment entities with `assignment type` + `lesson linkage`, reuse existing localStorage mock persistence style.

## Key Insights
- Current teacher course/lesson system already centralized in `course-detail-data.ts`.
- Assignment page is disconnected mock; no lesson-bound data model.
- Fastest path: introduce assignment model in same data module first, then wire UI.

## Requirements
### Functional
- Define assignment types: `quiz`, `code`, `document`, `project`.
- Each assignment must bind to both `courseId` and `lessonId`.
- Support list/create/update-basic-status in localStorage.
- Provide helper APIs consumable by assignments page.

### Non-functional
- Keep API of data helpers simple, deterministic.
- Backward-safe: old localStorage data should not break page.
- Keep logic isolated; UI page should call helper functions only.

## Architecture
- Extend `course-detail-data.ts` with:
  - `TeacherAssignmentType`
  - `TeacherLessonAssignment`
  - storage key builder and validators
  - load/save helpers by `(courseId, lessonId)`
- Data flow:
  - UI selects lesson -> calls `loadTeacherLessonAssignments(courseId, lessonId)`
  - On create/edit -> mutate list -> `saveTeacherLessonAssignments(...)`

## Related Code Files
### Modify
- `src/app/(teacher)/teacher/courses/course-detail-data.ts`

### Create
- none (MVP, avoid new files)

### Delete
- none

## Implementation Steps
1. Add new union type `TeacherAssignmentType`.
2. Add interface `TeacherLessonAssignment` with fields:
   - `id`, `courseId`, `lessonId`, `title`, `type`, `instructions`, `status`, `dueAt`, `maxScore`, `createdAt`, `updatedAt`.
3. Add in-memory seed map for demo data keyed by `courseId:lessonId`.
4. Add storage prefix constants + key generator.
5. Add validator `isTeacherLessonAssignment`.
6. Add helpers:
   - `loadTeacherLessonAssignments(courseId, lessonId)`
   - `saveTeacherLessonAssignments(courseId, lessonId, assignments)`
7. Add optional utility to enumerate teacher courses with chapters (if assignments page needs one call).
8. Verify no regressions in existing course/lesson helpers.

## Todo List
- [ ] Add assignment type + interface
- [ ] Add storage key + validators
- [ ] Add load/save helpers by lesson
- [ ] Add seed data for demo
- [ ] Run lint/typecheck for touched module

## Success Criteria
- `assignments/page.tsx` can import and use assignment helpers directly.
- Assignments persist after refresh by lesson scope.
- Invalid localStorage payload falls back safely.

## Risk Assessment
- Risk: module size grows (>200 lines already).
  - Mitigation: keep minimal additions; if growth too large in implementation, split to `teacher-assignment-data.ts`.
- Risk: key collisions in localStorage.
  - Mitigation: strict prefix + `courseId:lessonId` composite key.

## Security Considerations
- Teacher-only UI route remains role-protected by existing layout/guard.
- Validate parsed localStorage payload type before render to avoid unsafe object assumptions.

## Next Steps
- Feed this data model into page-level 3-column flow in Phase 02.
