# Brainstorm Report: Project Refactor & Testing

**Date:** 2026-03-20
**Timeline:** 3-5 days
**Approach:** Incremental refactoring

---

## Problem Statement

Project cần refactor toàn diện và setup testing. API backend ~50-80% ready, còn nhiều mock data cần thay thế.

## Scan Results Summary

| Module | Issues | Critical | High | Medium |
|--------|--------|----------|------|--------|
| Auth | 19 | 4 | 3 | 5 |
| Course/Lesson | 20 | 3 | 4 | 6 |
| Dashboard/Teacher | 16 | 8 | 2 | 3 |
| **Total** | **55** | **15** | **9** | **14** |

---

## Critical Issues (Must Fix)

### 1. Authentication Flow
- **Race condition in useLogin()** - `selectProfile` called without proper await
- **Missing error handling** in useSelectProfile(), useSelectOrg()
- **State persistence bug** - registerRole, sessionToken not persisted correctly
- **API contract mismatch** - getMe() unwraps response incorrectly

### 2. Mock Data Hardcoding
- **Lesson page** shows same mock course regardless of URL params
- **Course metadata** uses mock data for SEO
- **All 8 teacher pages** use hardcoded mock data instead of API
- **Children page** uses MOCK_CHILDREN instead of useChildren() hook

### 3. Missing Core Implementations
- **Enrollment logic** - handleEnroll() is empty stub
- **Progress tracking** - handleVideoProgress() only logs, doesn't save
- **Lesson completion** - not tracked, no XP awarded

---

## High Priority Issues

### Error Handling Gaps
- 6 hooks in use-courses.ts missing try-catch
- Mutations in use-classes.ts, use-livestream.ts have no onError handlers
- Courses page has no error UI state

### API Integration Issues
- Client-side search filtering instead of server-side
- Featured courses filtered client-side
- Load More button non-functional
- pinMessage/deleteMessage missing sessionId in endpoint

### Type Safety
- String vs Number ID mismatches in lesson page
- Unsafe type casting without validation
- Loose error handling (untyped catch blocks)

---

## Recommended Solution

### Phase 1: Setup Testing (Day 1)
1. Install Vitest + testing-library
2. Configure vitest.config.ts for Next.js
3. Setup test utilities, mocks
4. Write baseline tests for critical paths

### Phase 2: Fix Auth Module (Day 1-2)
1. Fix race conditions in login flow
2. Add error handling to all mutations
3. Fix API contract mismatches
4. Add proper state persistence

### Phase 3: Fix Course/Lesson Module (Day 2-3)
1. Replace mock data with API calls
2. Implement enrollment logic
3. Implement progress tracking
4. Add error states to all pages

### Phase 4: Fix Dashboard/Teacher Module (Day 3-4)
1. Replace all 8 pages' mock data with API
2. Fix livestream service endpoints
3. Add loading/error states
4. Implement missing features

### Phase 5: Testing & Polish (Day 4-5)
1. Unit tests for services
2. Unit tests for hooks
3. Integration tests for critical flows
4. Code review and cleanup

---

## Implementation Considerations

### Testing Strategy (Unit Tests Only)
```
Priority 1: Services (auth, course, class)
Priority 2: Hooks (use-auth, use-courses)
Priority 3: Utilities (api-client, errors)
Priority 4: Stores (auth.store)
```

### Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| API not ready | High | Conditional mock fallback |
| Breaking changes | Medium | Incremental commits |
| Timeline overrun | Medium | Prioritize critical fixes |

### Success Criteria
- [ ] All critical bugs fixed
- [ ] Vitest setup complete
- [ ] 80%+ coverage on services/hooks
- [ ] No TypeScript errors
- [ ] All pages functional with real API

---

## Detailed Issue List

### Auth Module (19 issues)
1. Race condition useLogin() - use-auth.ts:78-106
2. Missing onError useSelectProfile() - use-auth.ts:141-156
3. Missing onError useSelectOrg() - use-auth.ts:159-177
4. State persistence bug - auth.store.ts:118-129
5. API mismatch getMe() - auth.service.ts:169-170
6. Type mismatch setActiveOrg() - login/organization/page.tsx:25
7. Missing org code - login/organization/page.tsx:25
8. Null check issue - login/role/page.tsx:26
9. Unhandled promise - login/role/page.tsx:40
10. Missing activeRole sync - login/role/page.tsx:34
11. Direct localStorage - api-client.ts:34-72
12. Token refresh race - api-client.ts:110-128
13. Unused useLogoutDevice() - use-auth.ts:202-208
14. Inconsistent error handling - use-auth.ts:103-105
15. Mock children data - login/children/page.tsx:10
16. Loose error typing - use-auth.ts:103
17. Permission type cast - use-auth.ts:172
18. XSS risk localStorage - api-client.ts:51-62
19. Missing CSRF protection

### Course/Lesson Module (20 issues)
1. Mock data hardcoding - lesson/page.tsx:31-100
2. Mock metadata - courses/[slug]/layout.tsx:2-14
3. ID type mismatch - lesson/page.tsx:161-174
4. Empty handleEnroll() - courses/[slug]/page.tsx:57-60
5. Empty handlePreview() - courses/[slug]/page.tsx:62-65
6. Progress not saved - lesson/page.tsx:178-182
7. Completion not tracked - lesson/page.tsx:184-188
8-12. Missing error handling - use-courses.ts (5 hooks)
13. No error UI - courses/page.tsx:76-80
14. Client-side search - courses/page.tsx:24-31
15. Client-side featured filter - use-courses.ts:244-245
16. Load More broken - courses/page.tsx:82-92
17. Hardcoded enrollment - courses/[slug]/page.tsx:46-47
18. Type casting - use-courses.ts:64
19. Inconsistent mock data - mock-data/courses.ts:24-33
20. Unnecessary useMemo - lesson/page.tsx:158-174

### Dashboard/Teacher Module (16 issues)
1. Mock stats - teacher/page.tsx:23-43
2. Mock notifications - teacher/page.tsx:64-65
3. Mock classes - teacher/classes/page.tsx:20
4. Mock courses - teacher/courses/page.tsx:22
5. Mock students - teacher/students/page.tsx:15
6. Mock analytics - teacher/analytics/page.tsx:22-42
7. Mock assignments - teacher/assignments/page.tsx:23
8. Mock exams - teacher/exams/page.tsx:22
9. pinMessage endpoint - livestream.service.ts:139
10. deleteMessage endpoint - livestream.service.ts:142
11. Broad cache invalidation - use-classes.ts, use-livestream.ts
12. Missing onError handlers - use-classes.ts, use-livestream.ts
13. Polling performance - use-livestream.ts:81
14. Hardcoded welcome - teacher/page.tsx:65
15. No loading/error states - all teacher pages
16. Inconsistent naming - teacher/courses/page.tsx

---

## Unresolved Questions
1. Which APIs are actually ready vs still in development?
2. Should we add E2E tests later or stick with unit only?
3. Any specific performance targets for the app?
