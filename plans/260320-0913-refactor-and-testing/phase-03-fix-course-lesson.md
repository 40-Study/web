# Phase 3: Fix Course/Lesson Module

## Overview

- **Priority**: P1 (Critical)
- **Status**: Pending
- **Effort**: 8h
- **Issues**: 20

Replace mock data với API calls, implement missing features (enrollment, progress tracking).

## Context

- [Brainstorm Report - Course Section](../reports/brainstorm-260320-0913-refactor-and-testing.md#courselesson-module-20-issues)

## Critical Issues (Fix First)

### 1. Mock Data Hardcoding - lesson/page.tsx:31-100

**Problem**: Page uses hardcoded MOCK_COURSE regardless of URL params.

**Fix**: Fetch course by slug from API
```typescript
// Before
const MOCK_COURSE = { slug: "react-fundamentals", ... }

// After
export default function LessonPage({ params }: { params: { courseSlug: string; lessonId: string } }) {
  const { data: course, isLoading, error } = useCourseBySlug(params.courseSlug)

  if (isLoading) return <LessonSkeleton />
  if (error || !course) return <ErrorState message="Không tìm thấy khóa học" />

  const currentLesson = course.lessons.find(l => l.id === params.lessonId)
  if (!currentLesson) return <ErrorState message="Không tìm thấy bài học" />

  // ... rest
}
```

### 2. Empty handleEnroll() - courses/[slug]/page.tsx:57-60

**Fix**: Implement enrollment
```typescript
// Add hook
import { useEnrollCourse } from "@/hooks/use-courses"

// In component
const enrollMutation = useEnrollCourse()

const handleEnroll = async () => {
  try {
    await enrollMutation.mutateAsync(course.id)
    toast.success("Đăng ký khóa học thành công!")
    setIsEnrolled(true)
  } catch (error) {
    toast.error("Đăng ký thất bại", {
      description: "Vui lòng thử lại sau"
    })
  }
}
```

### 3. Progress Not Saved - lesson/page.tsx:178-182

**Fix**: Save progress to API
```typescript
// Add hook
import { useSaveProgress } from "@/hooks/use-courses"

const saveProgressMutation = useSaveProgress()

const handleVideoProgress = useCallback((progress: number) => {
  // Debounce: only save every 10 seconds or on significant change
  if (Math.abs(progress - lastSavedProgress) > 5 || progress >= 95) {
    saveProgressMutation.mutate({
      lessonId: currentLesson.id,
      progress,
      timestamp: Date.now(),
    })
    setLastSavedProgress(progress)
  }
}, [currentLesson.id, lastSavedProgress])
```

### 4. Completion Not Tracked - lesson/page.tsx:184-188

**Fix**: Mark lesson complete and award XP
```typescript
import { useCompleteLesson } from "@/hooks/use-courses"

const completeMutation = useCompleteLesson()

const handleVideoComplete = async () => {
  try {
    const result = await completeMutation.mutateAsync(currentLesson.id)
    if (result.xpAwarded) {
      toast.success(`+${result.xpAwarded} XP!`, {
        description: "Bạn đã hoàn thành bài học"
      })
    }
    // Navigate to next lesson or show completion UI
  } catch (error) {
    console.error('Complete lesson failed:', error)
  }
}
```

## High Priority Issues

### 5. Add Missing Hooks to use-courses.ts

```typescript
// Add these hooks:

export function useCourseBySlug(slug: string) {
  return useQuery({
    queryKey: courseKeys.detail(slug),
    queryFn: () => courseService.getBySlug(slug),
    enabled: !!slug,
  })
}

export function useEnrollCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (courseId: string) => courseService.enroll(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.enrolled() })
    },
  })
}

export function useSaveProgress() {
  return useMutation({
    mutationFn: (data: { lessonId: string; progress: number; timestamp: number }) =>
      courseService.saveProgress(data),
  })
}

export function useCompleteLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (lessonId: string) => courseService.completeLesson(lessonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.all })
    },
  })
}
```

### 6. Add Service Methods to course.service.ts

```typescript
// Add to CourseService class:

async getBySlug(slug: string): Promise<Course> {
  return apiClient.get<Course>(`${this.endpoint}/slug/${slug}`)
}

async enroll(courseId: string): Promise<{ message: string }> {
  return apiClient.post(`${this.endpoint}/${courseId}/enroll`, {})
}

async saveProgress(data: { lessonId: string; progress: number; timestamp: number }): Promise<void> {
  return apiClient.post(`/lessons/${data.lessonId}/progress`, data)
}

async completeLesson(lessonId: string): Promise<{ xpAwarded: number }> {
  return apiClient.post(`/lessons/${lessonId}/complete`, {})
}
```

### 7. Fix Client-Side Search - courses/page.tsx:24-31

**Fix**: Use server-side search via API
```typescript
// Before
const filteredCourses = courses?.filter(c =>
  c.title.toLowerCase().includes(searchQuery.toLowerCase())
)

// After
const { data: courses, isLoading } = useCourses({
  ...filters,
  keyword: debouncedSearchQuery, // Pass to API
})
// No client-side filtering needed
```

### 8. Fix Load More - courses/page.tsx:82-92

**Fix**: Implement pagination
```typescript
const [page, setPage] = useState(1)
const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteCourses({
  ...filters,
  limit: 12,
})

const handleLoadMore = () => {
  if (hasNextPage) {
    fetchNextPage()
  }
}
```

## Medium Priority Issues

### 9. Add Error Handling to All Hooks

```typescript
// Pattern for all query hooks:
export function useCourses(filters?: CourseFilters) {
  return useQuery({
    queryKey: courseKeys.list(filters),
    queryFn: () => courseService.list(filters),
    // Add error handling
    meta: {
      errorMessage: "Không thể tải danh sách khóa học"
    },
  })
}

// Global error handler in query-client.ts:
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      onError: (error, query) => {
        const message = query.meta?.errorMessage || "Đã có lỗi xảy ra"
        toast.error(message)
      },
    },
  },
})
```

### 10. Add Error UI to courses/page.tsx

```typescript
const { data: courses, isLoading, error } = useCourses(filters)

if (error) {
  return (
    <div className="text-center py-12">
      <p className="text-destructive">Không thể tải khóa học</p>
      <Button variant="outline" onClick={() => refetch()}>
        Thử lại
      </Button>
    </div>
  )
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/(lesson)/learn/[courseSlug]/[lessonId]/page.tsx` | Replace mock, add progress/completion |
| `src/app/(main)/courses/page.tsx` | Fix search, pagination, error UI |
| `src/app/(main)/courses/[slug]/page.tsx` | Implement enrollment |
| `src/hooks/use-courses.ts` | Add missing hooks, error handling |
| `src/services/course.service.ts` | Add missing methods |
| `src/lib/query-client.ts` | Add global error handler |

## Todo List

- [ ] Create useCourseBySlug hook
- [ ] Create useEnrollCourse hook
- [ ] Create useSaveProgress hook
- [ ] Create useCompleteLesson hook
- [ ] Add service methods for new hooks
- [ ] Replace mock data in lesson page
- [ ] Implement handleEnroll()
- [ ] Implement handleVideoProgress()
- [ ] Implement handleVideoComplete()
- [ ] Fix server-side search
- [ ] Implement pagination
- [ ] Add error states to all pages
- [ ] Write tests for course hooks

## Success Criteria

- Lesson page loads course from API by slug
- Enrollment works end-to-end
- Progress saves to backend
- Lesson completion awards XP
- Search uses server-side filtering
- Pagination works
- All pages have loading/error states

## Next Steps

After this phase: [Phase 4 - Fix Dashboard/Teacher](./phase-04-fix-dashboard-teacher.md)
