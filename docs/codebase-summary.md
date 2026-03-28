# Codebase Summary

## Repomix snapshot
- Generated via `npx repomix` at the repository root, producing `repomix-output.xml` for AI-friendly compaction and token accounting.
- The snapshot confirms the project contains ~333 files and ~432K tokens, with the App Router and Live Rooms tabs among the largest contributors.

## High-level overview
- **Framework**: Next.js 14 App Router with React 18, TypeScript, Tailwind CSS, and Suspense-friendly data fetching.
- **Data**: `apiClient` (Axios wrapper) feeds services defined under `src/services`, which extend `BaseService<T>` for CRUD operations.
- **State**: Zustand stores (e.g., `stores/auth.store.ts`) manage persisted auth/session data, while hooks/queries use TanStack Query v5.
- **UX**: Shared UI primitives live under `src/components/ui`, and domain-specific modules (teacher, lesson, live) live under their own app segments.

## Key directory responsibilities
- `src/app/`: App Router entry points organized in layout groups (`(teacher)`, `(student)`, `(lesson)`, `(live)`, etc.). Each page co-locates UI and data wiring for the route.
- `src/components/`: Reusable components (`ui`, `course`, `lesson`, `guard`, `layout`, `gamification`) supply consistent styling and role guarding.
- `src/services/`: `BaseService` encapsulates REST calls; specialized services (`course.service.ts`, `video.service.ts`, etc.) reuse it for backend integration.
- `src/lib/`: Houses `api-client`, permission helpers, and shared utilities such as error wrappers and UI helpers.
- `src/hooks/` & `src/stores/`: Provide query abstractions, utility hooks, and global state (auth, onboarding flags, etc.).

## Teacher assignment-management flow
- `/teacher/assignments` page references `course-detail-data.ts` for course summaries, chapter/lesson loaders, and local-storage-backed assignment persistence.
- The flow forces the teacher to follow a course → lesson → assignment creation path, with search filters, status/type badges, and instant saves via `saveTeacherLessonAssignments`.
- Query parameters (`courseId`, `lessonId`) hydrate the view for deep links, while the form enforces trimmed inputs, due dates, and optional scores before saving.

## Tooling & build
- Standard scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm run format`.
- Styling via Tailwind CSS v3 with shared `cn()` helpers and `uv`-like component tokens.
- Local development relies only on client-side guards (RoleGuard/Can) since middleware lacks storage access, so auth is enforced via UI components.
