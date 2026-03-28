# System Architecture

## High-Level modules
- **App Router segments** (`src/app/`): Auth, main, teacher, student, lesson, and live segments each provide a shared navigation/layout shell. They rely on Next.js layouts for drawers, sidebars, and top-level context such as auth state.
- **Shared UI** (`src/components/ui`): Contains reusable shadcn-style primitives (Badge, Button, Input, Select) plus domain-specific widgets for courses, lessons, and gamification.
- **Services layer** (`src/services`): Each service extends `BaseService<T>` (API client wrapper) and exposes `getAll`, `getById`, `create`, `update`, `delete`. E.g., `course.service.ts` handles course data, `livestream.service.ts` handles LiveKit interactions.
- **Helper libs** (`src/lib`): Houses `api-client`, permissions helpers, error wrappers, and utilities such as `cn` for className merging.
- **State & hooks**: Zustand stores (`src/stores`) hold auth and UI state; hooks (`src/hooks/queries`) wrap TanStack Query to keep components decoupled from service implementations.

## Data Flow for Teacher Assignment Management
1. Teacher lands on `/teacher/assignments` (client component). `getTeacherAssignmentCourseSummaries()` builds the list of courses from `TEACHER_COURSE_DETAIL_MAP`.
2. Selecting a course triggers `loadTeacherCourseChapters(courseId)` to fetch chapters (prefers `localStorage` data). Lesson list is memoized and filtered via `lessonSearch`.
3. Lesson selection loads assignment data through `loadTeacherLessonAssignments(courseId, lessonId)` and stores the results in state. Assignments include `status`, `type`, `dueAt`, `maxScore`, `instructions`, and timestamps.
4. Assignment creation uses `saveTeacherLessonAssignments(courseId, lessonId, assignments)` to persist the new list back to `localStorage`. The UI enforces required fields (`title`, `instructions`, `dueAt`) before saving.
5. Query params (`courseId`, `lessonId`) hydrate the view during initial load, enabling deep links and consistent selection.
6. Status/type badges map to CSS classes defined in `STATUS_BADGE_CLASS` and `TYPE_BADGE_CLASS` so UI color semantics stay centralized.

## Persistence & Storage
- Local data keys follow the `teacher-<entity>-v1` prefix (e.g., `teacher-lesson-assignments-v1`). Each helper wraps `localStorage` access with `try/catch` and falls back to static fixtures when storage is unavailable.
- Seed data for courses, lessons, comments, and assignments lives in `TEACHER_COURSE_DETAIL_MAP`, `TEACHER_LESSON_COMMENT_MAP`, and `TEACHER_LESSON_ASSIGNMENT_MAP` inside `course-detail-data.ts`.
- Assignment creation timestamps are generated via `new Date().toISOString()` and stored alongside the assignment to support future sync or audit features.

## Routing & UX
- `/teacher/assignments` relies on three panes: course selection, lesson selection, and assignment management, all built as responsive cards with consistent spacing (`space-y-6`, `grid grid-cols`).
- Badge colors and button states reuse `Status`/`Type` constants to keep them in sync across the UI.
- Deep links via query parameters let other flows (e.g., lesson detail page) link directly to the assignment editor while preserving the selected course/lesson context.

## Tooling & Safety
- Validations: All user input is trimmed and required fields are verified prior to saving; optional fields like `maxScore` are sanitized with `Number(value) || undefined`.
- The page uses `useEffect` hooks to guard hydration and only renders after `isHydrated` to avoid mismatches between server/client renders.
- Services with network calls (e.g., `BaseService`) rely on `apiClient` and follow RESTful conventions, while local UI flows remain decoupled from backend APIs.
