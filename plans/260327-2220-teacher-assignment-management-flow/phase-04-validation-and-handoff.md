# Phase 04 — Validation + handoff

## Context Links
- `src/app/(teacher)/teacher/assignments/page.tsx`
- `src/app/(teacher)/teacher/courses/course-detail-data.ts`
- `src/app/(teacher)/teacher/courses/[id]/page.tsx`
- `src/app/(teacher)/teacher/courses/[id]/lessons/[lessonId]/page.tsx`
- `package.json` scripts (`lint`, `build`)

## Overview
- Priority: P1
- Status: pending
- Brief: verify behavior and prep clear implementation handoff checklist.

## Key Insights
- Main failure risks: state mismatch from query params, persistence bugs, and UI regressions.
- Validate by user journey, not just compile.

## Requirements
### Functional validation
- Path A: `/teacher/assignments` -> pick course -> lesson -> create quiz assignment.
- Path B: from lesson detail -> click `Giao bài tập` -> preselected context.
- Path C: refresh page -> assignment still visible for lesson.

### Non-functional validation
- Lint/build clean.
- No obvious runtime error in browser console.

## Architecture
- Manual smoke tests + standard repo commands.
- Keep tests focused on changed flow (YAGNI).

## Related Code Files
### Modify
- none (validation phase)

### Create
- optional report file in `plans/reports/` if team requires execution notes.

### Delete
- none

## Implementation Steps
1. Run `npm run lint`.
2. Run `npm run build`.
3. Manual flow checks:
   - select course/lesson
   - create each assignment type at least once (`quiz`, `code`)
   - verify persistence after reload
4. Manual deep-link checks:
   - with valid `courseId/lessonId`
   - with invalid params (fallback behavior)
5. Capture issues and fixes before final merge.

## Todo List
- [ ] Lint pass
- [ ] Build pass
- [ ] Manual flow pass
- [ ] Deep-link pass
- [ ] Final handoff summary

## Success Criteria
- All primary teacher flows work without mocks disconnected from lesson context.
- Flow matches user ask in Vietnamese context.

## Risk Assessment
- Risk: compile passes but UX edge-case fails (invalid params).
  - Mitigation: explicit fallback + default auto-select logic.

## Security Considerations
- Keep actions teacher-scoped only in UI route.
- Avoid exposing unnecessary personal student data in assignment creation surface.

## Next Steps
- If approved, implementation agent executes phases in order and updates roadmap/changelog if needed.
