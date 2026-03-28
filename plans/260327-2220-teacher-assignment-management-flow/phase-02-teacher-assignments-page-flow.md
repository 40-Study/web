# Phase 02 — Assignment page UX (course → lesson → assign)

## Context Links
- `src/app/(teacher)/teacher/assignments/page.tsx`
- `src/app/(teacher)/teacher/courses/course-detail-data.ts`
- existing teacher page style patterns under `src/app/(teacher)/teacher/courses/**`

## Overview
- Priority: P1
- Status: pending
- Brief: replace current disconnected mock dashboard with concrete teacher flow: pick course, pick lesson, create/manage assignments.

## Key Insights
- User asks explicitly: “có tất cả các khóa, chọn vào từng lesson, rồi chọn giao bài tập (quiz, code...)”.
- Existing assignment detail-heavy analytics block gives low value now; selection + creation flow gives highest value.
- Keep single route (`/teacher/assignments`) but stateful with selected course/lesson.

## Requirements
### Functional
- Show full teacher course list.
- On course select: show chapter-grouped lessons.
- On lesson select:
  - show lesson-bound assignment list
  - show creation form with assignment type selector
- Form minimum fields: `title`, `type`, `instructions`, `dueAt`, `maxScore`.
- Support assignment statuses at least: `draft`, `published`, `closed`.
- Search/filter minimal:
  - search courses by title
  - search lessons by title
  - filter assignments by type/status (basic)

### Non-functional
- Keep page responsive and readable.
- Avoid adding heavy dependencies.
- Keep file manageable; extract internal sections if file grows too large.

## Architecture
- Replace current 2-pane mock with 3-pane structure:
  1) Course pane
  2) Lesson pane
  3) Assignment pane (list + create form)
- Source of truth:
  - course/lesson: `course-detail-data.ts`
  - assignments: new helpers in same module (Phase 01)
- URL sync (optional but recommended): query params `courseId`, `lessonId` for deep-link/open state.

## Related Code Files
### Modify
- `src/app/(teacher)/teacher/assignments/page.tsx`
- `src/app/(teacher)/teacher/courses/course-detail-data.ts` (consume helpers)

### Create (only if file-size pressure)
- `src/app/(teacher)/teacher/assignments/assignment-form.tsx` (optional)
- `src/app/(teacher)/teacher/assignments/assignment-list.tsx` (optional)

### Delete
- none

## Implementation Steps
1. Remove static `MOCK_ASSIGNMENTS`/`MOCK_SUBMISSIONS` coupling in page.
2. Build derived course list from teacher data source.
3. Add selected course state + selected lesson state.
4. Render chapter/lesson tree for selected course.
5. Wire assignment list load using `(selectedCourseId, selectedLessonId)`.
6. Build create-assignment form with type options: quiz/code/document/project.
7. On submit:
   - validate required fields
   - append assignment with timestamps
   - persist via save helper
8. Add lightweight status badge and type badge in assignment list.
9. Add empty states:
   - no course
   - no lesson
   - no assignments for lesson
10. Add query param hydration (`courseId`, `lessonId`) to support deep links.
11. Keep UX concise; remove low-value fake analytics blocks from old UI.

## Todo List
- [ ] Convert page to 3-step flow
- [ ] Wire real in-repo mock persistence (no static arrays)
- [ ] Add assignment create form and save logic
- [ ] Add query-param preselect behavior
- [ ] Add empty/loading states
- [ ] Run lint/typecheck

## Success Criteria
- Teacher can complete full path in one screen:
  - select course -> select lesson -> create quiz/code assignment.
- Refresh page keeps assignments by lesson.
- Query `/teacher/assignments?courseId=1&lessonId=l3` opens correct context.

## Risk Assessment
- Risk: one file becomes too long and hard to maintain.
  - Mitigation: optional extraction into small page-local components.
- Risk: user confusion if no course selected by default.
  - Mitigation: auto-select first available course/lesson on initial load.

## Security Considerations
- Do not trust query params blindly; validate selected course/lesson exists before using.
- Sanitize form values (trim) before save.

## Next Steps
- Add entry points from course + lesson pages (Phase 03).
