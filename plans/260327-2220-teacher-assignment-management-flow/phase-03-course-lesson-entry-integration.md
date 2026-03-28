# Phase 03 — Course/Lesson integration entry points

## Context Links
- `src/app/(teacher)/teacher/courses/[id]/page.tsx`
- `src/app/(teacher)/teacher/courses/[id]/lessons/[lessonId]/page.tsx`
- `src/app/(teacher)/teacher/assignments/page.tsx`

## Overview
- Priority: P2
- Status: pending
- Brief: make assignment flow reachable directly where teacher works with lessons.

## Key Insights
- Teachers already navigate in course detail + lesson detail; forcing sidebar jump slows task.
- Deep links reduce friction and satisfy “chọn lesson rồi giao bài tập”.

## Requirements
### Functional
- Course detail page: add CTA per lesson (or global CTA with current lesson context) to assignment page.
- Lesson detail page: add prominent “Giao bài tập” button.
- Both links include `courseId`, `lessonId` query params.

### Non-functional
- Keep visual style consistent with existing teacher buttons.
- No route changes required.

## Architecture
- Navigation-only integration, no duplicated assignment business logic.
- Assignment page remains single source for create/list actions.

## Related Code Files
### Modify
- `src/app/(teacher)/teacher/courses/[id]/page.tsx`
- `src/app/(teacher)/teacher/courses/[id]/lessons/[lessonId]/page.tsx`

### Create
- none

### Delete
- none

## Implementation Steps
1. In course detail lesson row actions, add button/link:
   - `/teacher/assignments?courseId=${courseId}&lessonId=${lesson.id}`
2. In lesson detail header actions, add same deep-link button.
3. Ensure button text clear: `Giao bài tập`.
4. Verify route highlight in sidebar remains `Quản lý bài tập` when open.

## Todo List
- [ ] Add deep-link CTA from course detail
- [ ] Add deep-link CTA from lesson detail
- [ ] Verify query-param handoff works end-to-end

## Success Criteria
- Teacher can start from lesson and reach preselected assignment form in one click.
- No broken links for invalid/nonexistent lesson IDs (graceful fallback).

## Risk Assessment
- Risk: crowded header/actions in course detail page.
  - Mitigation: prefer compact outline button per lesson row or contextual dropdown.

## Security Considerations
- Validate query-selected lesson belongs to query-selected course; else reset selection.

## Next Steps
- Run validation and document behavior in handoff notes (Phase 04).
