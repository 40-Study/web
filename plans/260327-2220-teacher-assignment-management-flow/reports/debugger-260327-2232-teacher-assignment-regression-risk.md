# Regression Risk Review — Teacher Assignment Management Flow

## Scope
- Changed files only:
  - `/Users/tvanlee/Documents/Đồ án/web/src/app/(teacher)/teacher/assignments/page.tsx`
  - `/Users/tvanlee/Documents/Đồ án/web/src/app/(teacher)/teacher/courses/[id]/page.tsx`
  - `/Users/tvanlee/Documents/Đồ án/web/src/app/(teacher)/teacher/courses/[id]/lessons/[lessonId]/page.tsx`
  - `/Users/tvanlee/Documents/Đồ án/web/src/app/(teacher)/teacher/courses/course-detail-data.ts`
- Focused on edge cases: invalid query params, missing course/lesson data, localStorage fallback integrity.
- Targeted check run:
  - `npm run lint -- --file <4 changed files>` → pass, no ESLint errors.

## Executive Summary
- No immediate hard crash found in new assignment flow under normal usage.
- Main risk is data-integrity drift in localStorage scenarios (tampered/stale payloads, ID-collision assumptions).
- Query-param handling is mostly safe (invalid values degrade to empty UI state), but UX can become inconsistent/misleading.
- Priority: add input/data guards at boundaries to prevent silent wrong-data rendering.

## Findings by edge case

### 1) Invalid query params (`courseId`, `lessonId`)

#### Behavior now
- `assignments/page.tsx` reads params via `useSearchParams()`.
- `courseId` invalid/unmapped:
  - `selectedCourseId` set to invalid value.
  - `loadTeacherCourseChapters(invalid)` returns fallback empty chapters.
  - `lessons` empty, assignments cleared, form mostly disabled.
  - No runtime throw.
- `lessonId` invalid for chosen course:
  - Effect auto-replaces with first available lesson if any.
  - No runtime throw.

#### Risk
- **Low runtime risk**, **medium correctness/UX risk**:
  - Invalid `courseId` remains selected even when not in course list.
  - UI may show “khóa này chưa có lesson” while real issue is invalid param.

#### Verdict
- Safe from crash; partially safe from state drift.

---

### 2) Missing course/lesson data

#### Behavior now
- `getTeacherCourseDetail(courseId)` returns synthetic fallback (`draft`, empty `chapters`) if unknown.
- `loadTeacherCourseChapters` uses localStorage or fallback and validates schema.
- `lesson detail page`:
  - resolves lesson via `findLessonInChapters`.
  - if hydrated and not found → `notFound()`.

#### Risk
- **Low runtime risk** on assignment page.
- **Low/medium route risk** on lesson detail page:
  - not found path is handled intentionally; no null deref before guard.

#### Verdict
- Missing data path is handled safely in changed flow.

---

### 3) localStorage fallback integrity

#### Behavior now
- All loaders wrap JSON parsing in `try/catch` and fallback safely.
- Strong shape guards exist (`isTeacherCourseChapter`, `isTeacherLessonAssignment`, etc.).
- Assignment list render assumes `dueAt` is string; validator enforces string.

#### Risks
1. **Assignment-course/lesson consistency not validated**
   - `isTeacherLessonAssignment` checks `courseId`/`lessonId` are strings, not equal to current key context.
   - Tampered payload with mismatched IDs can still render under wrong lesson key.
2. **Lesson identity assumption may collide**
   - lesson selection uses `lesson.id` only.
   - storage key is `courseId:lessonId` (no `chapterId`).
   - if duplicate lesson IDs exist inside one course, data can overlap or wrong lesson selected.
3. **Silent localStorage write failures**
   - `save*` catches and swallows errors.
   - no user signal when persistence fails (quota/private mode).

#### Verdict
- Crash-safe, but integrity guarantees are incomplete.

## Likely runtime failure points (prioritized)

### Must-have
1. Validate `courseId` param against known course IDs before setting selected course.
   - Prevents invalid-selected state and misleading empty lesson UI.
2. Enforce context match in assignment loader validation.
   - Reject records where `assignment.courseId !== courseId` or `assignment.lessonId !== lessonId`.
3. Guard against duplicate lesson IDs per course (or key assignments by stable composite identity).
   - Prevent wrong assignment list mapping if curriculum expands.

### Optional
1. Normalize/encode route query values (`encodeURIComponent` when building links).
2. Add non-blocking UI feedback for localStorage write failures.
3. Parse/format due date robustly (avoid trusting free-form strings forever).

## Recommendation summary
- Current implementation is **operationally stable** for normal path.
- Highest regression exposure is **silent data mismatch**, not app crash.
- Implement must-have guards first; optional items improve resilience and diagnosability.

## Unresolved questions
1. Is lesson ID guaranteed unique within a course across all chapters (contracted by backend/domain)?
2. Should invalid query params auto-fallback to first valid course, or show explicit invalid-link state?
3. Should localStorage persistence failure be surfaced to teachers (toast/banner) or remain silent by design?
