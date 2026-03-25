# Route Restructuring Plan

## Context
Current codebase uses role-based route groups: `(student)`, `(teacher)`, `(admin)`. This causes:
- Unnecessary prefix like `/student/home` for default app user
- Potential route duplication between roles
- Complex authorization mixed with folder structure

## Problem
User wants to restructure according to:
1. **Domain/feature-based** organization, not role-based
2. **URL reflects usage context**, not every role
3. **Shared screens** use single page + conditional UI per role
4. **Separate routes** only when business intent differs
5. **Authorization** via middleware + server checks, not folder structure

## Current Structure (11 groups)

```
(auth)       - Login, Register, OTP
(main)       - /courses, /leaderboard, /profile, /achievements, /settings
(student)    - /student/home, /student/courses
(teacher)    - /teacher/schedule, /teacher/courses, /teacher/students, etc.
(live)       - /rooms/[roomName]
(lesson)     - /learn/[courseSlug]/[lessonId]
(admin)      - /roles, /organizations
```

## Proposed Structure (6 groups)

### 1. `(auth)` - Authentication (no URL change)
Routes: `/login`, `/register`, `/otp`, `/forgot-password`, `/reset-password`

### 2. `(app)` - Authenticated shared app
Routes for ALL authenticated users (student, teacher, admin):
- `/home` (was `/student/home`)
- `/courses` (shared - different UI per role)
- `/courses/[slug]` (shared - enrolled vs public view)
- `/achievements`
- `/leaderboard`
- `/profile`
- `/profile/[userId]`
- `/schedule` (NEW - student schedule)
- `/discussions`
- `/settings`

### 3. `(learning)` - Learning experience (specific intent)
Routes: `/learn/[courseSlug]/[lessonId]`
- Different intent from `/courses/[slug]` - this is the actual lesson player
- Student-specific but isolated for focus

### 4. `(live)` - Live classroom (specific intent)
Routes: `/rooms/[roomName]`
- LiveKit integration
- Teacher + Student interaction

### 5. `(teacher)` - Teacher management area
Routes:
- `/teacher` (dashboard)
- `/teacher/courses`
- `/teacher/courses/[id]`
- `/teacher/courses/create`
- `/teacher/schedule`
- `/teacher/students`
- `/teacher/analytics`
- `/teacher/wallet`
- `/teacher/assignments`

### 6. `(admin)` - Admin management area
Routes:
- `/admin` (dashboard)
- `/admin/roles`
- `/admin/organizations`
- `/admin/users` (future)

## Key Changes

### URL Changes
| Old URL | New URL |
|---------|---------|
| `/student/home` | `/home` |
| `/student/courses` | `/courses` (with student UI) |
| `/dashboard/parent` | N/A (PARENT uses student routes) |
| `/dashboard` (generic) | `/admin` |

### Route Group Changes
| Old Group | New Group | Reason |
|-----------|-----------|--------|
| `(main)` public routes | `(public)` | Clearer separation |
| `(main)` authenticated | `(app)` | Shared authenticated routes |
| `(student)` | `(app)` | Student = default user, no prefix needed |
| `(lesson)` | `(learning)` | Better naming |

## Implementation Phases

### Phase 1: Create new structure (no breaking changes)
1. Create `(public)` layout for guest routes
2. Rename `(main)` → `(app)` for authenticated shared routes
3. Add new shared routes to `(app)`

### Phase 2: Migrate student routes
1. Move `/student/home` → `/home`
2. Move `/student/courses` → `/courses` (or deprecate, use shared)
3. Update bottom-nav and sidebar links

### Phase 3: Clean up teacher/admin
1. Keep `(teacher)` and `(admin)` as-is - they represent management intent
2. Only add `/teacher/*` and `/admin/*` routes in these groups

### Phase 4: Authorization
1. Update middleware for `/teacher/*` and `/admin/*`
2. Add role checks in `(app)` layout
3. Remove unused RoleGuard patterns

## Files to Modify
- `src/app/` - reorganize route groups
- `src/lib/routes.ts` - update ROLE_HOME_ROUTES
- `src/components/layout/bottom-nav.tsx` - update nav items
- `src/components/layout/student-sidebar.tsx` - update nav items
- `src/middleware.ts` - update route matching
- `src/lib/permissions.ts` - ensure capability-based checks

## Success Criteria
- No duplicate pages for same business intent
- Student = default app user without `/student` prefix
- `/teacher/*` and `/admin/*` only for management routes
- Authorization in middleware + server, not folder structure
