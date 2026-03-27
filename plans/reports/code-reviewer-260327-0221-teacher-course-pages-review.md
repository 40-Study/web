## Code Review Summary

### Scope
- Files:
  - src/app/(teacher)/teacher/courses/course-detail-data.ts
  - src/app/(teacher)/teacher/courses/[id]/page.tsx
  - src/app/(teacher)/teacher/courses/[id]/lessons/[lessonId]/page.tsx
- Focus: functional correctness + regressions
- Scout findings: recent commit touched `src/app/(teacher)/teacher/courses/[id]/page.tsx`; dependent read/write paths are localStorage loaders used by lesson detail page too.

### Overall Assessment
Feature works for happy path. Main regression risk is unvalidated persisted data shape from localStorage causing runtime crashes on course/lesson rendering.

### Critical Issues
- None found.

### High Priority
1. Unvalidated `chapters` payload can crash UI when schema drifts/corrupts.
   - File: `/Users/tvanlee/Documents/Đồ án/web/src/app/(teacher)/teacher/courses/course-detail-data.ts` (150-160)
   - Impact: `loadTeacherCourseChapters` only checks top-level array, then force-casts. If an item misses `lessons`, course page calls `chapter.lessons.length` and throws.
   - Affected usage:
     - `/Users/tvanlee/Documents/Đồ án/web/src/app/(teacher)/teacher/courses/[id]/page.tsx` (208, 213)
     - `/Users/tvanlee/Documents/Đồ án/web/src/app/(teacher)/teacher/courses/[id]/lessons/[lessonId]/page.tsx` (38)
   - Must-fix: add runtime normalization/validation before returning persisted chapters.

### Medium Priority
1. `localStorage.setItem` writes are not guarded.
   - File: `/Users/tvanlee/Documents/Đồ án/web/src/app/(teacher)/teacher/courses/course-detail-data.ts` (165-168, 185-188)
   - Impact: quota/storage errors can throw in effect path and break rendering.
   - Fix: wrap writes in `try/catch` and fail safe.

### Low Priority
- None.

### Edge Cases Found by Scout
- Cross-page dependency: lesson detail page relies on chapter loader shape from course detail page persistence.
- Boundary case: malformed/stale localStorage after schema changes.

### Positive Observations
- Hydration guard prevents server/client mismatch.
- Storage keys are namespaced by course/lesson to avoid data bleed.
- Empty states and action disabling handled reasonably.

### Recommended Actions
1. Add strict runtime validation/normalization for loaded chapters/comments.
2. Guard localStorage writes with `try/catch`.
3. (Optional) bump storage version when schema changes to avoid stale payloads.

### Metrics
- Type Coverage: not measured in this review
- Test Coverage: not measured in this review
- Linting Issues: not run in this review

### Unresolved Questions
- Is there an agreed migration strategy for persisted mock data when lesson/chapter schema changes?
