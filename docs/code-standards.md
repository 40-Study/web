# Code Standards

## App Router structure
- Group entry points inside app router layout segments such as `(teacher)`, `(student)`, `(lesson)`, and `(live)` so that each segment shares its own navigation shell and guard logic before rendering pages.
- Keep each page under 200 LOC (split UI parts into `components` or `app/(teacher)/teacher/assignments/*` helpers when needed) and prefer using layout cards + grids for high-density admin views like `/teacher/assignments`.
- Always set `"use client"` explicitly when a page relies on `window`, hooks, or Zustand stores.

## Component & UI patterns
- Use shadcn-style primitives (`Badge`, `Button`, `Card`, `Input`, `Select`, `Textarea`) imported from `@/components/ui/*` to ensure consistent spacing, borders, and responsive behavior.
- Wrap role-dependent UI with `RoleGuard` or `Can` when the page is protected (teacher-only flows already live inside `/teacher`).
- Compose complex views by creating small helper components (e.g., `SummaryBox` inside `assignments/page.tsx`) rather than duplicating styles.

## State management & data fetching
- Favor service classes under `src/services` extending `BaseService<T>` with centralized `apiClient` usage for backend data, and keep local-only fixtures inside modules such as `course-detail-data.ts` when the feature is client-only.
- Derive lists with `useMemo` (lesson trees, search filters, badges) and react to route parameters using `useSearchParams`/`useParams` so renders stay predictable.
- Persist user-created artifacts (assignment drafts, lesson comments) through helper modules that serialize to `localStorage` with versioned keys (see `getTeacherLessonAssignmentsStorageKey`). Wrap `localStorage` access in `if (typeof window === "undefined") return` to prevent hydration errors.

## Validations & error handling
- Always `trim()` user input before validation, e.g., `title`, `instructions`, and `dueAt` in the assignment form, and guard against empty values before saving (see `handleCreateAssignment`).
- Provide fallback data when persistence fails (helper functions return seeded fixtures from `TEACHER_LESSON_ASSIGNMENT_MAP` or `TEACHER_COURSE_DETAIL_MAP`).
- Keep optional fields (like `maxScore`) typed as `number | undefined`, validating numeric strings with `Number(value) || undefined` before persisting.

## Naming & badges
- Align status and type constants with `TeacherAssignmentStatus`/`TeacherAssignmentType` from `course-detail-data.ts`. Use `STATUS_BADGE_CLASS` and `TYPE_BADGE_CLASS` records to map semantic values to CSS utility classes so colors remain consistent across the UI.
- Assignment IDs use the `asg-${Date.now()}` convention for uniqueness during client-only sessions; include `createdAt`/`updatedAt` timestamps to support future sorting or sync.

## Documentation & onboarding
- Keep docs under `web/docs/` with one topic per file and cross-link using relative paths (already added `project-overview-pdr.md`, `codebase-summary.md`, `code-standards.md`, `system-architecture.md`).
- Mention key helpers in docs so developers know where to look when extending the flow (e.g., `loadTeacherCourseChapters`, `saveTeacherLessonAssignments`).
- Confirm validations and TODOs referenced here against actual code for accuracy before publishing changes.
