# Project Overview & Product Development Requirements

## Purpose & Scope
ForteX Web is the teacher-facing experience for coordinating course lessons, assignments, and student feedback inside a single Next.js 14 App Router shell. The current sprint centers on the teacher assignment-management flow that guides instructors through the ordered path: **course → lesson → assignment type** and persists drafts locally while keeping the UI grounded in real course content.

## Functional Requirements
- List every teacher course (from `src/app/(teacher)/teacher/courses/course-detail-data.ts`) in a searchable pane with status badges showing `published` vs. `draft` data.
- After selecting a course, display all chapters and lessons (chapter metadata + title) so teachers can view the lesson tree before choosing one.
- When a lesson is selected, load persisted assignment records (`loadTeacherLessonAssignments`) filtered by `courseId` and `lessonId`, and show badges for `TeacherAssignmentType` + `TeacherAssignmentStatus` per `src/app/(teacher)/teacher/assignments/page.tsx`.
- Provide a constrained creation form (fields: `title`, `type`, `status`, `dueAt`, optional `maxScore`, `instructions`) that trims input, validates required fields, attaches timestamps, and calls `saveTeacherLessonAssignments` on submit.
- Keep the view synched with `courseId` and `lessonId` query parameters so deep links like `/teacher/assignments?courseId=1&lessonId=l4` open the correct context without extra navigation.

## Non-functional Requirements
- UI must remain responsive across desktop/tablet heights (`grid-cols` layout with fixed pane heights) and fall back silently when no course or lesson is selected.
- No new third-party dependencies beyond the existing stack (Lucide icons, Tailwind, shadcn primitives, Lucide, etc.).
- Local persistence relies exclusively on `localStorage` (no server calls), so fail gracefully if storage is unavailable (default to module fixtures in `course-detail-data.ts`).
- Maintainable code: keep per-page files under 200 LOC or split into micro-components if growth threatens readability.

## Acceptance Criteria
1. Teacher workflows follow `course → lesson → assignment` order illustrated in `/teacher/assignments` (three-pane layout) and persist data across reloads via localStorage helpers.
2. Assignment creation requires trimmed `title`, `instructions`, and `dueAt`, and supplies `maxScore` only when provided; once saved, the list updates and the new assignment becomes selected.
3. Switching courses and lessons reloads assignments immediately, and badges reflect seeded statuses/types with consistent color mapping (`TYPE_BADGE_CLASS`, `STATUS_BADGE_CLASS`).
4. Query parameter hydration selects valid `courseId`/`lessonId`, defaults to the first available course/lesson when missing, and leaves the search/filter inputs ready for typing.

## Constraints & Technical Notes
- Entire feature is client-only (`"use client"` at the top of the page) because middleware lacks access to `localStorage` or window scope.
- Assignment IDs are generated using timestamps (`asg-${Date.now()}`) and saved to `localStorage` via `TeacherLessonAssignment` helpers, so there is no server persistence yet.
- Guard against invalid query params by checking `courses.some((course) => course.id === requestedCourseId)` before accepting values (already implemented in the page load effect).

## Implementation Guidance
- Reference `getTeacherAssignmentCourseSummaries`, `loadTeacherCourseChapters`, and `findLessonInChapters` to mirror the existing code-path; avoid duplicating data by deriving state instead of patching raw fixtures.
- Use `useMemo` for derived lists and `useEffect` dependencies that rely on `selectedCourseId`/`selectedLessonId` to avoid redundant renders.
- Keep styling consistent with neighboring `/teacher` pages (cards, badges, responsive grids) and reuse `SummaryBox`, `Badge`, and `Button` primitives to maintain visual coherence.

## Version History
- `2026-03-27`: Baseline PDR created to describe the course → lesson → assignment flow, local persistence strategy, and deep-link requirements for the teacher assignments page.