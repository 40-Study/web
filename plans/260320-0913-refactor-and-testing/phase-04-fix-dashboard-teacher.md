# Phase 4: Fix Dashboard/Teacher Module

## Overview

- **Priority**: P1 (Critical)
- **Status**: Pending
- **Effort**: 8h
- **Issues**: 16

Replace all 8 teacher pages' mock data with real API calls.

## Context

- [Brainstorm Report - Dashboard Section](../reports/brainstorm-260320-0913-refactor-and-testing.md#dashboardteacher-module-16-issues)

## Pages to Fix (8 pages with mock data)

### 1. Teacher Dashboard - teacher/page.tsx

**Current**: Uses `mockStats`, `mockCourses`, `mockRecentActivity` hardcoded.

**Fix**:
```typescript
// Create hooks
export function useTeacherStats() {
  return useQuery({
    queryKey: ['teacher', 'stats'],
    queryFn: () => apiClient.get('/teacher/stats'),
  })
}

export function useTeacherRecentActivity() {
  return useQuery({
    queryKey: ['teacher', 'activity'],
    queryFn: () => apiClient.get('/teacher/activity'),
  })
}

// In component
export default function TeacherDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useTeacherStats()
  const { data: courses, isLoading: coursesLoading } = useTeacherCourses()
  const { data: activity, isLoading: activityLoading } = useTeacherRecentActivity()

  if (statsLoading || coursesLoading || activityLoading) {
    return <DashboardSkeleton />
  }

  return (
    // ... use real data
  )
}
```

### 2. Teacher Classes - teacher/classes/page.tsx

**Current**: Uses `MOCK_CLASSES` constant.

**Fix**:
```typescript
import { useClasses } from "@/hooks/queries/use-classes"

export default function TeacherClassesPage() {
  const { data, isLoading, error } = useClasses()

  if (isLoading) return <ClassesSkeleton />
  if (error) return <ErrorState />

  return (
    // ... use data.classes
  )
}
```

### 3. Teacher Courses - teacher/courses/page.tsx

**Current**: Uses `mockCourses` constant.

**Fix**:
```typescript
import { useTeacherCourses } from "@/hooks/use-courses"

export default function TeacherCoursesPage() {
  const { data: courses, isLoading, error } = useTeacherCourses()

  if (isLoading) return <CoursesSkeleton />
  if (error) return <ErrorState />

  return (
    // ... use courses
  )
}

// Add to use-courses.ts
export function useTeacherCourses() {
  return useQuery({
    queryKey: courseKeys.teacher(),
    queryFn: () => courseService.getTeacherCourses(),
  })
}
```

### 4. Teacher Students - teacher/students/page.tsx

**Current**: Uses `MOCK_STUDENTS` constant.

**Fix**:
```typescript
import { useClassStudents } from "@/hooks/queries/use-classes"

export default function TeacherStudentsPage() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const { data: students, isLoading } = useClassStudents(selectedClassId)

  // ... use students
}
```

### 5. Teacher Analytics - teacher/analytics/page.tsx

**Current**: Uses hardcoded `enrollmentData`, `completionData`, `distributionData`, stats.

**Fix**:
```typescript
// Create hook
export function useTeacherAnalytics() {
  return useQuery({
    queryKey: ['teacher', 'analytics'],
    queryFn: () => apiClient.get('/teacher/analytics'),
  })
}

// In component
const { data: analytics, isLoading } = useTeacherAnalytics()

if (isLoading) return <AnalyticsSkeleton />

const { enrollmentData, completionData, distributionData, stats } = analytics
```

### 6. Teacher Assignments - teacher/assignments/page.tsx

**Current**: Uses `mockAssignments` constant.

**Fix**:
```typescript
// Create hook
export function useTeacherAssignments() {
  return useQuery({
    queryKey: ['teacher', 'assignments'],
    queryFn: () => apiClient.get('/teacher/assignments'),
  })
}

// In component
const { data: assignments, isLoading } = useTeacherAssignments()
```

### 7. Teacher Exams - teacher/exams/page.tsx

**Current**: Uses `mockExams` constant.

**Fix**:
```typescript
// Create hook
export function useTeacherExams() {
  return useQuery({
    queryKey: ['teacher', 'exams'],
    queryFn: () => apiClient.get('/teacher/exams'),
  })
}

// In component
const { data: exams, isLoading } = useTeacherExams()
```

### 8. Parent Dashboard Children - login/children/page.tsx

**Already covered in Phase 2**

## API Issues to Fix

### 9. Fix pinMessage/deleteMessage - livestream.service.ts

**Problem**: Missing sessionId in endpoint.

**Fix**:
```typescript
// Before
pinMessage: (sessionId: string, messageId: string) =>
  apiClient.post(`/chat/${messageId}/pin`, {}), // Missing sessionId!

// After
pinMessage: (sessionId: string, messageId: string) =>
  apiClient.post(`/livestream/${sessionId}/chat/${messageId}/pin`, {}),

deleteMessage: (sessionId: string, messageId: string) =>
  apiClient.delete(`/livestream/${sessionId}/chat/${messageId}`),
```

### 10. Fix Broad Cache Invalidation

**Problem**: Invalidates all queries when only specific ones changed.

**Fix**:
```typescript
// Before
onSuccess: () => {
  qc.invalidateQueries({ queryKey: classKeys.all })
}

// After
onSuccess: (_, variables) => {
  qc.invalidateQueries({ queryKey: classKeys.detail(variables.classId) })
  qc.invalidateQueries({ queryKey: classKeys.list() })
}
```

### 11. Add onError Handlers

**Fix**: Add to all mutations in use-classes.ts, use-livestream.ts
```typescript
return useMutation({
  mutationFn: /* ... */,
  onSuccess: /* ... */,
  onError: (error) => {
    console.error('Mutation error:', error)
    toast.error("Thao tác thất bại", {
      description: error instanceof Error ? error.message : "Vui lòng thử lại"
    })
  },
})
```

### 12. Fix Polling Performance - use-livestream.ts:81

**Fix**: Add smart polling with backoff
```typescript
export function useParticipants(sessionId: string) {
  const [hasChanges, setHasChanges] = useState(true)

  return useQuery({
    queryKey: livestreamKeys.participants(sessionId),
    queryFn: () => livestreamService.getParticipants(sessionId),
    refetchInterval: hasChanges ? 10_000 : 30_000, // Slower when no changes
    refetchIntervalInBackground: false, // Don't poll when tab inactive
  })
}
```

## New Hooks to Create

Create `src/hooks/queries/use-teacher.ts`:

```typescript
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export const teacherKeys = {
  all: ['teacher'] as const,
  stats: () => [...teacherKeys.all, 'stats'] as const,
  courses: () => [...teacherKeys.all, 'courses'] as const,
  activity: () => [...teacherKeys.all, 'activity'] as const,
  analytics: () => [...teacherKeys.all, 'analytics'] as const,
  assignments: () => [...teacherKeys.all, 'assignments'] as const,
  exams: () => [...teacherKeys.all, 'exams'] as const,
}

export function useTeacherStats() {
  return useQuery({
    queryKey: teacherKeys.stats(),
    queryFn: () => apiClient.get('/teacher/stats'),
  })
}

export function useTeacherCourses() {
  return useQuery({
    queryKey: teacherKeys.courses(),
    queryFn: () => apiClient.get('/teacher/courses'),
  })
}

export function useTeacherRecentActivity() {
  return useQuery({
    queryKey: teacherKeys.activity(),
    queryFn: () => apiClient.get('/teacher/activity'),
  })
}

export function useTeacherAnalytics() {
  return useQuery({
    queryKey: teacherKeys.analytics(),
    queryFn: () => apiClient.get('/teacher/analytics'),
  })
}

export function useTeacherAssignments() {
  return useQuery({
    queryKey: teacherKeys.assignments(),
    queryFn: () => apiClient.get('/teacher/assignments'),
  })
}

export function useTeacherExams() {
  return useQuery({
    queryKey: teacherKeys.exams(),
    queryFn: () => apiClient.get('/teacher/exams'),
  })
}
```

## Files to Modify/Create

| File | Action | Changes |
|------|--------|---------|
| `src/hooks/queries/use-teacher.ts` | Create | New file with teacher hooks |
| `src/app/(dashboard)/dashboard/teacher/page.tsx` | Modify | Replace mock with hooks |
| `src/app/(dashboard)/teacher/classes/page.tsx` | Modify | Use useClasses() |
| `src/app/(dashboard)/teacher/courses/page.tsx` | Modify | Use useTeacherCourses() |
| `src/app/(dashboard)/teacher/students/page.tsx` | Modify | Use useClassStudents() |
| `src/app/(dashboard)/teacher/analytics/page.tsx` | Modify | Use useTeacherAnalytics() |
| `src/app/(dashboard)/teacher/assignments/page.tsx` | Modify | Use useTeacherAssignments() |
| `src/app/(dashboard)/teacher/exams/page.tsx` | Modify | Use useTeacherExams() |
| `src/services/livestream.service.ts` | Modify | Fix pinMessage/deleteMessage |
| `src/hooks/queries/use-classes.ts` | Modify | Add onError handlers |
| `src/hooks/queries/use-livestream.ts` | Modify | Fix polling, add onError |

## Todo List

- [ ] Create use-teacher.ts with all hooks
- [ ] Replace mock in teacher dashboard
- [ ] Replace mock in teacher classes
- [ ] Replace mock in teacher courses
- [ ] Replace mock in teacher students
- [ ] Replace mock in teacher analytics
- [ ] Replace mock in teacher assignments
- [ ] Replace mock in teacher exams
- [ ] Fix livestream service endpoints
- [ ] Add onError to all mutations
- [ ] Fix polling performance
- [ ] Add loading/error states to all pages
- [ ] Write tests for teacher hooks

## Success Criteria

- All 8 teacher pages fetch from real API
- Loading states show during fetch
- Error states show on failure
- Livestream endpoints work correctly
- All mutations have error handlers
- Polling doesn't drain battery

## Next Steps

After this phase: [Phase 5 - Testing & Polish](./phase-05-testing-polish.md)
