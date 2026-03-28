## Code Review Summary

### Scope
- Files:
  - `/Users/tvanlee/Documents/Đồ án/web/src/app/(teacher)/teacher/courses/course-detail-data.ts`
  - `/Users/tvanlee/Documents/Đồ án/web/src/app/(teacher)/teacher/assignments/page.tsx`
  - `/Users/tvanlee/Documents/Đồ án/web/src/app/(teacher)/teacher/courses/[id]/page.tsx`
  - `/Users/tvanlee/Documents/Đồ án/web/src/app/(teacher)/teacher/courses/[id]/lessons/[lessonId]/page.tsx`
- LOC delta: +679 / -260 (net +419)
- Focus: recent teacher assignment-management implementation only
- Scout findings: checked boundary cases around query params, lesson identity, localStorage persistence

### Overall Assessment
Core flow is implemented and usable: teacher can pick course -> pick lesson -> create assignment by type (quiz/code/document/project), with deep-link entry from course/lesson pages. Data flow is coherent and persistence wiring is consistent with existing localStorage pattern.

### Critical Issues
- None found.

### High Priority
- None blocking core requested flow.

### Medium Priority
1. **Maintainability: assignments page is very large (486 lines)**
   - Impact: harder to test and evolve; violates project guidance to keep files around 200 LOC.
   - Suggestion: split into local components (course pane, lesson pane, assignment form, assignment list).

2. **Potential lesson identity ambiguity if IDs are reused in a course**
   - Current selection logic keys lesson by `lesson.id` only.
   - If duplicate IDs appear across chapters, selection and assignment mapping can drift.
   - Suggestion: enforce uniqueness per course or use composite identity (`chapterId + lessonId`) in state.

3. **Silent persistence failures**
   - `saveTeacherLessonAssignments` swallows storage errors.
   - Impact: teacher may think save succeeded when browser storage is unavailable/full.
   - Suggestion: surface non-blocking feedback (toast/banner) when save fails.

### Low Priority
1. **Plan requirement parity gap (non-blocking for core flow)**
   - Plan phase includes basic assignment filtering by type/status; current UI supports status update and badges, but not explicit list filter controls.

2. **Validation hardening**
   - `maxScore` and `dueAt` are minimally validated; UI constraints exist but domain checks are thin.

### Edge Cases Found by Scout
- Invalid `courseId` query is safely normalized to first valid course.
- Invalid `lessonId` query is normalized to first lesson of selected course when available.
- Assignment load is additionally filtered by selected `(courseId, lessonId)` after storage load.
- Remaining edge risk: duplicate lesson IDs and silent localStorage write failures.

### Positive Observations
- Flow fidelity to request is good: all courses -> lesson -> assignment type.
- Deep-link CTA added from both course detail and lesson detail pages.
- Data model additions are type-safe and include runtime shape guards for storage reads.
- Empty states are present for no courses/lessons/assignments.

### Recommended Actions
1. Refactor `assignments/page.tsx` into smaller components (medium priority).
2. Decide and enforce lesson ID uniqueness contract (or move to composite lesson identity).
3. Add user-visible feedback for storage write failure.
4. Optionally add assignment list filters (type/status) to fully match plan checklist.

### Metrics
- Type Coverage: not measured in repo tooling output
- Test Coverage: not measured
- Linting Issues: 14 warnings in project-wide lint run (none introduced in reviewed files)

### Merge Decision
- **GO** for merge on requested core feature flow.
- Follow up medium-priority hardening/refactor items in next pass.

### Unresolved Questions
1. Is `lesson.id` guaranteed unique per course across all chapters?
2. Should assignment filter-by-type/status be part of MVP acceptance or deferred?
3. Should save-failure feedback be required UX for teacher-facing forms?
