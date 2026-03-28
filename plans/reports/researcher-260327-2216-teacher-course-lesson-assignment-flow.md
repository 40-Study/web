# Research Report: Teacher course/lesson/assignment flow

## Executive Summary
- Teacher area is anchored by `(teacher)/layout.tsx`, wrapping every teacher page in `RoleGuard`, `TeacherSidebar`, and `BottomNav` (see `src/app/(teacher)/layout.tsx:1-27`).
- Course list → course detail → lesson detail is implemented with local mock data plus localStorage helpers (`course-detail-data.ts`).
- Assignment management currently lives under `/teacher/assignments` and reuses UI primitives (cards, tabs, dialogs) but is disconnected from course/lesson navigation and lacks assignment creation or type selection.

## Current eco-system flow
1. `/teacher/courses` page shows published/draft/archived tabs, a create-course CTA, and per-course cards linking to `/teacher/courses/[id]` (`src/app/(teacher)/teacher/courses/page.tsx:230-345`).
2. Course detail page loads `TeacherCourseDetail` via `getTeacherCourseDetail`, persists chapter/lesson edits to localStorage, and exposes dialogs for adding chapters/lessons (`src/app/(teacher)/teacher/courses/[id]/page.tsx:58-385`).
3. Lesson detail is a `findLessonInChapters`/comment UI reading the same localStorage-backed data (`src/app/(teacher)/teacher/courses/[id]/lessons/[lessonId]/page.tsx:3-169`).
4. Assignment list is a two-panel layout with filter chips/search, stats cards, and submission tabs but uses in-file `MOCK_ASSIGNMENTS` and `MOCK_SUBMISSIONS` (no hooks/services) and no link back to the lesson context (`src/app/(teacher)/teacher/assignments/page.tsx:35-259`).

## Gaps vs requested flow (course → lesson → assignment type)
- Assignment management is not part of the course/detail/lesson stack; teachers must navigate to a standalone `/teacher/assignments` page rather than starting from a lesson (gap vs request).
- Assignment data is mocked (`MOCK_ASSIGNMENTS`/`MOCK_SUBMISSIONS`) with no service/hook, so there is no persistence, no assignment-type API, and no per-lesson linkage (`src/app/(teacher)/teacher/assignments/page.tsx:35-257`).
- No UI exists on course or lesson pages to create assignments, select types (video/quiz/document), or surface assignment-specific forms; dialogs only cover chapters/lessons (`src/app/(teacher)/teacher/courses/[id]/page.tsx:96-385`).

## Reusable components/services/hooks
- `TeacherNotificationDialog` (used from courses/students pages) centralizes the notification modal with form validation and scheduled-send options (`src/components/teacher/teacher-notification-dialog.tsx:1-193`).
- Layout bits: `TeacherSidebar`, `Header`, `BottomNav`, `RoleGuard` (from layout file) define the teacher shell.
- `course-detail-data.ts` provides `TeacherCourseDetail`, `TeacherCourseChapter`, `TeacherCourseLesson`, localStorage helpers (`loadTeacherCourseChapters`, `saveTeacherCourseChapters`, `loadTeacherLessonComments`) and lookup helpers (`findLessonInChapters`) that already gate lesson-level state (`src/app/(teacher)/teacher/courses/course-detail-data.ts:1-248`).
- UI primitives from `components/ui/*` (Card, Button, Tabs, Select, ProgressBar, etc.) are reused across the teacher pages; no custom hooks beyond `useMemo`/`useState` are defined in these files.

## Recommended files to modify
1. `src/app/(teacher)/teacher/courses/[id]/page.tsx` – add assignment section per lesson or CTA linking to assignment types, and optionally surface assignment metadata when clicking lessons (`Lesson` button currently just navigates to lesson detail `line 214-239`).
2. `src/app/(teacher)/teacher/courses/[id]/lessons/[lessonId]/page.tsx` – extend with assignment creation controls/types and integrate with the lesson comment UI if assignments are lesson-scoped.
3. `src/app/(teacher)/teacher/assignments/page.tsx` – replace mock data with services/hooks tied to course/lesson IDs, add assignment creation form (type selector, deadlines), and connect the left panel to course/lesson filtering instead of standalone chips.
4. `src/app/(teacher)/teacher/courses/course-detail-data.ts` – expand data model to persist assignments, exposing new helpers to fetch/save assignment/lesson relationships for reuse in new flows.
5. `src/components/teacher/teacher-notification-dialog.tsx` (if assignments send reminders) – ensure it can accept assignment context so notifications stay in the same tooling.

## Unresolved Questions
- Are there backend services/endpoints for assignments already defined (if so, where) or should the new UI continue to rely on enhanced localStorage helpers?
- Should assignment types (video/quiz/sandbox/document) reuse the lesson `LessonType` union, or is there a separate taxonomy expected for assignments?
