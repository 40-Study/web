# Phase Implementation Report

## Executed Phase
- Phase: Priority 2 — Course CRUD (sections, lessons, lesson content, categories)
- Plan: /Users/tvanlee/Documents/Đồ án/web/plans/260401-0813-backend-web-api-integration/phase-03-integration.md
- Status: completed

## Files Modified

### Created
| File | Lines | Notes |
|------|-------|-------|
| `src/types/section.ts` | 29 | Section, CreateSectionDTO, UpdateSectionDTO, ReorderSectionsDTO |
| `src/types/lesson.ts` | 37 | Lesson, LessonType, CreateLessonDTO, UpdateLessonDTO, ReorderLessonsDTO |
| `src/types/lesson-content.ts` | 54 | LessonVideo, LessonArticle, LessonAttachment + create/update DTOs |
| `src/services/section.service.ts` | 50 | getSections, createSection, updateSection, deleteSection, reorderSections |
| `src/services/lesson.service.ts` | 64 | getLessons, getLesson, createLesson, updateLesson, deleteLesson, reorderLessons |
| `src/services/lesson-content.service.ts` | 80 | video/article/attachment CRUD |
| `src/services/category.service.ts` | 84 | full CRUD + tags (getAll, getById, getCourses, create, update, delete, getAllTags, createTag, deleteTag) |
| `src/hooks/queries/use-sections.ts` | 72 | useSections, useCreateSection, useUpdateSection, useDeleteSection, useReorderSections |
| `src/hooks/queries/use-lessons.ts` | 84 | useLessons, useLesson, useCreateLesson, useUpdateLesson, useDeleteLesson, useReorderLessons |
| `src/hooks/queries/use-lesson-content.ts` | 130 | video/article/attachment query+mutation hooks |
| `src/hooks/queries/use-categories.ts` | 110 | useCategoryList, useCategoryDetail, useCategoryCourses, useCreateCategory, useUpdateCategory, useDeleteCategory, useTags, useCreateTag, useDeleteTag |

### Modified
| File | Change |
|------|--------|
| `src/hooks/queries/index.ts` | Added exports for 4 new hook files |

## Tasks Completed
- [x] `section.service.ts` — full CRUD with nested routes `/courses/:courseId/sections`
- [x] `lesson.service.ts` — full CRUD with nested routes `/courses/:courseId/sections/:sectionId/lessons`
- [x] `lesson-content.service.ts` — video/article/attachments per lesson
- [x] `category.service.ts` — getAll/getById/getCourses/create/update/delete + tag CRUD
- [x] `use-sections.ts` — React Query hooks with toast notifications
- [x] `use-lessons.ts` — React Query hooks with toast notifications
- [x] `use-lesson-content.ts` — React Query hooks with toast notifications
- [x] `use-categories.ts` — admin CRUD hooks (renamed `useCategories` → `useCategoryList` to avoid collision with existing hook in `use-courses.ts`)
- [x] `hooks/queries/index.ts` — updated exports

## Tests Status
- Type check: pass (build completed without TS errors)
- Unit tests: n/a (no test suite configured)
- Integration tests: n/a
- Build: pass — all pages compiled successfully

## Issues Encountered
- **Name collision**: `useCategories` already exported from `src/hooks/use-courses.ts` (maps API data to frontend `Category` type). Resolved by naming the new admin version `useCategoryList` / `useCategoryDetail` in `use-categories.ts`. No changes to existing `use-courses.ts`.

## API Path Notes
- Sections use fully nested path: `PUT /courses/:courseId/sections/reorder` (per phase-03 spec). Reorder uses `section_ids` body param.
- Lessons use fully nested path: `PUT /courses/:courseId/sections/:sectionId/lessons/reorder`. Reorder uses `lesson_ids` body param.
- Lesson content split into `/video`, `/article`, `/attachments` sub-resources (not generic `/content`).

## Next Steps
- Phase-03 Priority 3: `enrollment.service.ts` + `use-enrollments.ts`
- Phase-03 Priority 4: rewrite `video.service.ts` to match actual backend upload endpoints

## Unresolved Questions
- None
