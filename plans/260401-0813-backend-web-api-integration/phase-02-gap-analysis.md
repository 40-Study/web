# Phase 2: Gap Analysis

## Overview
- **Priority**: P1
- **Status**: pending
- **Effort**: 3h

Map backend APIs to existing web services/hooks. Identify gaps.

---

## Legend
- ✅ Integrated (service + types match backend)
- ⚠️ Needs Update (partial/outdated implementation)
- ❌ Missing (not implemented)

---

## Auth Module

### Backend: `/api/auth`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| POST `/auth/register/request` | `authService.registerRequest` | `useRegisterRequest` | ✅ |
| POST `/auth/register` | `authService.register` | `useRegister` | ✅ |
| POST `/auth/login` | `authService.login` | `useLogin` | ✅ |
| POST `/auth/reset-password/request` | `authService.resetPasswordRequest` | `useResetPasswordRequest` | ✅ |
| POST `/auth/reset-password` | `authService.resetPassword` | `useResetPassword` | ✅ |
| POST `/auth/refresh-token` | `authService.refreshToken` | - | ✅ |
| GET `/auth/profiles` | - | - | ❌ |
| POST `/auth/profiles/system` | - | - | ❌ |
| POST `/auth/switch-profile` | `authService.switchProfile` | - | ⚠️ No hook |
| GET `/auth/me` | `authService.getMe` | `useMe` | ✅ |
| GET `/auth/me/profile` | `authService.getMyProfile` | `useMyProfile` | ✅ |
| GET `/auth/me/system-roles` | `authService.getMySystemRoles` | - | ⚠️ No hook |
| PUT `/auth/me` | `authService.updateProfile` | `useUpdateProfile` | ✅ |
| GET `/auth/devices` | `authService.getDevices` | `useDevices` | ✅ |
| POST `/auth/logout` | `authService.logout` | `useLogout` | ✅ |
| POST `/auth/logout-all` | `authService.logoutAll` | `useLogoutAll` | ✅ |
| PUT `/auth/change-password` | `authService.changePassword` | `useChangePassword` | ✅ |

### Files
- Service: `src/services/auth.service.ts` ✅
- Hook: `src/hooks/queries/use-auth.ts` ✅

### Gaps
1. Missing `getProfiles` endpoint
2. Missing `addSystemProfile` endpoint
3. `switchProfile` needs hook

---

## Course Module

### Backend: `/api/courses`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| GET `/courses` | `courseService.getCourses` | - | ⚠️ No hook |
| GET `/courses/:id` | `courseService.getCourseById` | - | ⚠️ No hook |
| POST `/courses` | - | - | ❌ |
| PUT `/courses/:id` | - | - | ❌ |
| DELETE `/courses/:id` | - | - | ❌ |

### Backend: `/api/courses/:courseId/sections`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| POST `/sections` | - | - | ❌ |
| GET `/sections` | - | - | ❌ |
| PUT `/sections/reorder` | - | - | ❌ |
| PUT `/sections/:id` | - | - | ❌ |
| DELETE `/sections/:id` | - | - | ❌ |

### Backend: `/api/.../lessons`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| All lesson CRUD | - | - | ❌ |

### Files
- Service: `src/services/course.service.ts` ⚠️ Partial
- Hook: None

### Gaps
1. Missing course CRUD (create/update/delete)
2. Missing section service entirely
3. Missing lesson service entirely
4. No React Query hooks

---

## Enrollment Module

### Backend: `/api/enrollments`, `/api/courses/:courseId/enroll`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| POST `/courses/:courseId/enroll` | `courseService.enroll` | - | ⚠️ No hook |
| DELETE `/courses/:courseId/enroll` | - | - | ❌ |
| GET `/enrollments` | `courseService.getEnrolledCourses` | - | ⚠️ No hook |
| GET `/enrollments/:id` | - | - | ❌ |
| PUT `/lessons/:lessonId/progress` | `courseService.saveProgress` | - | ⚠️ Wrong method (POST vs PUT) |

### Gaps
1. Missing unenroll endpoint
2. Missing enrollment detail endpoint
3. Progress uses POST but backend expects PUT
4. No hooks

---

## Lesson Content Module

### Backend: `/api/lessons/:lessonId`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| GET `/video` | - | - | ❌ |
| GET `/article` | - | - | ❌ |
| GET `/attachments` | - | - | ❌ |
| POST/PUT/DELETE video | - | - | ❌ |
| POST/PUT/DELETE article | - | - | ❌ |
| POST/DELETE attachments | - | - | ❌ |

### Gaps
- **Entire module missing** - Need `lesson-content.service.ts`

---

## Category Module

### Backend: `/api/categories`, `/api/tags`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| GET `/categories` | `courseService.getCategories` | - | ⚠️ In wrong service |
| GET `/categories/:id` | - | - | ❌ |
| POST `/categories` | - | - | ❌ |
| PUT `/categories/:id` | - | - | ❌ |
| DELETE `/categories/:id` | - | - | ❌ |
| GET `/tags` | - | - | ❌ |
| POST `/tags` | - | - | ❌ |
| DELETE `/tags/:id` | - | - | ❌ |

### Gaps
- Need dedicated `category.service.ts`
- Need `tag.service.ts` or combine with category

---

## Cart Module

### Backend: `/api/cart`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| GET `/cart` | - | - | ❌ |
| POST `/cart` | - | - | ❌ |
| DELETE `/cart` | - | - | ❌ |
| DELETE `/cart/clear` | - | - | ❌ |
| GET `/cart/check/:courseID` | - | - | ❌ |

### Gaps
- **Entire module missing** - Need `cart.service.ts`

---

## Order Module

### Backend: `/api/orders`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| POST `/orders` | - | - | ❌ |
| GET `/orders/me` | - | - | ❌ |
| GET `/orders/:id` | - | - | ❌ |
| POST `/orders/:id/cancel` | - | - | ❌ |
| POST `/orders/:id/payment-intent` | - | - | ❌ |
| GET `/orders/:id/payment-status` | - | - | ❌ |
| POST `/orders/:id/check-payment` | - | - | ❌ |

### Gaps
- **Entire module missing** - Need `order.service.ts`

---

## Voucher Module

### Backend: `/api/vouchers`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| GET `/vouchers/public` | - | - | ❌ |
| GET `/vouchers/code/:code` | - | - | ❌ |
| GET `/vouchers/me` | `voucherService.getMyVouchers` | `useVoucher` | ⚠️ Uses MOCK data |
| POST `/vouchers/:id/save` | - | - | ❌ |
| DELETE `/vouchers/:id/save` | - | - | ❌ |
| Admin CRUD | - | - | ❌ |

### Files
- Service: `src/services/voucher.service.ts` ⚠️ Mock only
- Hook: `src/hooks/queries/use-voucher.ts` ⚠️

### Gaps
1. Replace mock with real API calls
2. Add all missing endpoints

---

## Class Module

### Backend: `/api/classes`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| POST `/classes` | `classService.create` | - | ⚠️ No hook |
| GET `/classes` | `classService.list` | `useClasses` | ✅ |
| GET `/classes/:id` | `classService.getById` | - | ⚠️ No hook |
| PUT `/classes/:id` | `classService.update` | - | ⚠️ No hook |
| DELETE `/classes/:id` | `classService.delete` | - | ⚠️ No hook |
| Teacher/Student mgmt | `classService.*` | - | ⚠️ No hooks |
| Schedule mgmt | `classService.*` | - | ⚠️ No hooks |
| Attendance mgmt | `classService.*` | - | ⚠️ No hooks |

### Files
- Service: `src/services/class.service.ts` ✅
- Hook: `src/hooks/queries/use-classes.ts` ⚠️ Partial

### Gaps
- Need more React Query hooks for mutations

---

## Organization Module

### Backend: `/api/organizations`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| POST `/organizations` | `organizationService.create` | - | ⚠️ No hook |
| GET `/organizations` | `organizationService.list` | - | ⚠️ No hook |
| GET `/organizations/:id` | `organizationService.getById` | - | ⚠️ No hook |
| PUT `/organizations/:id` | `organizationService.update` | - | ⚠️ No hook |
| DELETE `/organizations/:id` | `organizationService.delete` | - | ⚠️ No hook |
| GET `/:id/members` | `organizationService.getMembers` | - | ⚠️ No hook |

### Files
- Service: `src/services/organization.service.ts` ✅
- Hook: None

### Gaps
- Need React Query hooks

---

## Role Module

### Backend: `/api/org-roles`, `/api/system-roles`, `/api/permissions`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| Org role CRUD | `roleService.*` | - | ⚠️ No hooks |
| System role CRUD | `roleService.*` | - | ⚠️ No hooks |
| Permissions | `roleService.listPermissions` | - | ⚠️ No hook |
| User role assignment | `roleService.*` | - | ⚠️ No hooks |

### Files
- Service: `src/services/role.service.ts` ✅
- Hook: None

### Gaps
- Need React Query hooks for admin UI

---

## Livestream Module

### Backend: `/api/livestream`, `/api/chat`, `/api/whiteboard`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| Session CRUD | `livestreamService.*` | `useLivestream` | ✅ |
| Start/End/Join/Leave | `livestreamService.*` | - | ⚠️ Need hooks |
| Participants | `livestreamService.*` | - | ⚠️ Need hooks |
| Chat | `livestreamService.*` | - | ⚠️ Need hooks |
| Whiteboard | `livestreamService.*` | - | ⚠️ Need hooks |
| Screen share | - | - | ❌ |

### Files
- Service: `src/services/livestream.service.ts` ✅
- Hook: `src/hooks/queries/use-livestream.ts` ⚠️ Partial

### Gaps
1. Missing screenshare endpoints
2. Need mutation hooks

---

## Video Upload Module

### Backend: `/api/videos`, `/api/hls`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| Init upload | `videoService.initUpload` | - | ⚠️ Response structure differs |
| Presigned URLs | - | - | ❌ Backend uses POST not GET |
| Chunk complete | - | - | ❌ Different endpoint |
| Complete upload | `videoService.completeUpload` | - | ⚠️ |
| Upload status | `videoService.getUploadStatus` | - | ⚠️ |
| Resume info | `videoService.resumeUpload` | - | ⚠️ |
| Incomplete uploads | - | - | ❌ |
| Abort upload | `videoService.cancelUpload` | - | ⚠️ |
| Processing queue | - | - | ❌ Different path |
| HLS streaming | `videoService.getMasterPlaylist` | - | ⚠️ |

### Files
- Service: `src/services/video.service.ts` ⚠️ Outdated API structure

### Gaps
1. API paths/methods don't match backend
2. Need complete rewrite to match actual backend

---

## Schedule Module

### Backend: Uses `/api/classes/:classId/schedules`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| All endpoints | `scheduleService` | - | ❌ Wrong endpoint |

### Files
- Service: `src/services/schedule.service.ts` ❌ Points to non-existent `/schedule/events`

### Gaps
- Service endpoint doesn't exist in backend
- Should use class schedules from `classService`

---

## Teacher Module

### Backend: `/api/teachers`, `/api/teacher-profiles`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| GET `/teachers` | - | `useTeacher` | ⚠️ Hook exists, no service |
| GET `/teachers/:id` | - | - | ❌ |
| DELETE `/teachers/:id` | - | - | ❌ |
| Teacher profiles CRUD | - | - | ❌ |

### Files
- Service: None
- Hook: `src/hooks/queries/use-teacher.ts` ⚠️

### Gaps
- Need `teacher.service.ts`

---

## Assignment & Submission Module

### Backend: `/api/assignments`, `/api/submissions`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| Assignment CRUD | `livestreamService.*` | - | ⚠️ In wrong service |
| Submissions | `livestreamService.*` | - | ⚠️ In wrong service |
| Code execution | `livestreamService.runCode` | - | ⚠️ |

### Gaps
- Should be separate `assignment.service.ts` and `submission.service.ts`

---

## Analytics Module

### Backend: `/api/analytics`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| All endpoints | - | - | ❌ |

### Gaps
- **Entire module missing** - Need `analytics.service.ts`

---

## Upload Module

### Backend: `/api/upload`
| Endpoint | Web Service | Hook | Status |
|----------|-------------|------|--------|
| POST `/upload` | - | - | ❌ |
| POST `/upload/any` | - | - | ❌ |
| DELETE `/upload` | - | - | ❌ |

### Gaps
- **Entire module missing** - Need `upload.service.ts`

---

## Summary

### Services Status
| Service | Status | Action |
|---------|--------|--------|
| auth.service.ts | ✅ Good | Add 2 missing endpoints |
| course.service.ts | ⚠️ Partial | Add CRUD, section, lesson |
| class.service.ts | ✅ Good | Add hooks |
| organization.service.ts | ✅ Good | Add hooks |
| role.service.ts | ✅ Good | Add hooks |
| voucher.service.ts | ⚠️ Mock | Replace with real API |
| livestream.service.ts | ✅ Good | Add missing endpoints |
| video.service.ts | ⚠️ Outdated | Rewrite to match backend |
| schedule.service.ts | ❌ Wrong | Remove or rewrite |
| cart.service.ts | ❌ Missing | Create new |
| order.service.ts | ❌ Missing | Create new |
| category.service.ts | ❌ Missing | Create new |
| lesson-content.service.ts | ❌ Missing | Create new |
| teacher.service.ts | ❌ Missing | Create new |
| analytics.service.ts | ❌ Missing | Create new |
| upload.service.ts | ❌ Missing | Create new |

### Priority Order
1. **High**: Cart, Order (commerce flow)
2. **High**: Course CRUD, Sections, Lessons (content creation)
3. **Medium**: Voucher real API, Category/Tags
4. **Medium**: Video service rewrite
5. **Low**: Analytics, Teacher profiles
