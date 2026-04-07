# Backend API Checklist

> Auto-generated from backend router analysis. Last updated: 2026-03-30

## Legend
- ✅ Integrated (web service exists)
- ⚠️ Partial (needs update)
- ❌ Missing (not implemented)

---

## Auth (`/api/auth`) ✅
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/auth/register/request` | ✅ | authService.registerRequest |
| POST | `/auth/register` | ✅ | authService.register |
| POST | `/auth/login` | ✅ | authService.login |
| POST | `/auth/reset-password/request` | ✅ | authService.resetPasswordRequest |
| POST | `/auth/reset-password` | ✅ | authService.resetPassword |
| POST | `/auth/refresh-token` | ✅ | authService.refreshToken |
| GET | `/auth/profiles` | ❌ | - |
| POST | `/auth/profiles/system` | ❌ | - |
| POST | `/auth/switch-profile` | ✅ | authService.switchProfile |
| GET | `/auth/me` | ✅ | authService.getMe |
| GET | `/auth/me/profile` | ✅ | authService.getMyProfile |
| GET | `/auth/me/system-roles` | ✅ | authService.getMySystemRoles |
| PUT | `/auth/me` | ✅ | authService.updateProfile |
| GET | `/auth/devices` | ✅ | authService.getDevices |
| POST | `/auth/logout` | ✅ | authService.logout |
| POST | `/auth/logout-all` | ✅ | authService.logoutAll |
| PUT | `/auth/change-password` | ✅ | authService.changePassword |

## Courses (`/api/courses`) ⚠️
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/courses` | ✅ | courseService.getCourses |
| GET | `/courses/:id` | ✅ | courseService.getCourseById |
| POST | `/courses` | ❌ | - |
| PUT | `/courses/:id` | ❌ | - |
| DELETE | `/courses/:id` | ❌ | - |

## Sections (`/api/courses/:courseId/sections`) ❌
| Method | Endpoint | Status |
|--------|----------|--------|
| POST | `/sections` | ❌ |
| GET | `/sections` | ❌ |
| PUT | `/sections/reorder` | ❌ |
| PUT | `/sections/:id` | ❌ |
| DELETE | `/sections/:id` | ❌ |

## Lessons (`/api/.../lessons`) ❌
| Method | Endpoint | Status |
|--------|----------|--------|
| POST | `/lessons` | ❌ |
| GET | `/lessons` | ❌ |
| PUT | `/lessons/reorder` | ❌ |
| PUT | `/lessons/:id` | ❌ |
| DELETE | `/lessons/:id` | ❌ |

## Lesson Content (`/api/lessons/:lessonId`) ❌
| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/video` | ❌ |
| GET | `/article` | ❌ |
| GET | `/attachments` | ❌ |
| POST/PUT/DELETE | video/article/attachments | ❌ |

## Enrollments (`/api/enrollments`) ⚠️
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/courses/:id/enroll` | ✅ | courseService.enroll |
| DELETE | `/courses/:id/enroll` | ❌ | - |
| GET | `/enrollments` | ✅ | courseService.getEnrolledCourses |
| GET | `/enrollments/:id` | ❌ | - |
| PUT | `/lessons/:id/progress` | ⚠️ | Wrong HTTP method |

## Categories (`/api/categories`) ⚠️
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/categories` | ✅ | courseService.getCategories |
| GET | `/categories/:id` | ❌ | - |
| POST | `/categories` | ❌ | - |
| PUT | `/categories/:id` | ❌ | - |
| DELETE | `/categories/:id` | ❌ | - |

## Tags (`/api/tags`) ❌
| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/tags` | ❌ |
| POST | `/tags` | ❌ |
| DELETE | `/tags/:id` | ❌ |

## Cart (`/api/cart`) ❌
| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/cart` | ❌ |
| POST | `/cart` | ❌ |
| DELETE | `/cart` | ❌ |
| DELETE | `/cart/clear` | ❌ |
| GET | `/cart/check/:courseID` | ❌ |

## Orders (`/api/orders`) ❌
| Method | Endpoint | Status |
|--------|----------|--------|
| POST | `/orders` | ❌ |
| GET | `/orders/me` | ❌ |
| GET | `/orders/:id` | ❌ |
| POST | `/orders/:id/cancel` | ❌ |
| POST | `/orders/:id/payment-intent` | ❌ |
| GET | `/orders/:id/payment-status` | ❌ |
| POST | `/orders/:id/check-payment` | ❌ |

## Vouchers (`/api/vouchers`) ⚠️
| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/vouchers/public` | ❌ | |
| GET | `/vouchers/code/:code` | ❌ | |
| GET | `/vouchers/me` | ⚠️ | Uses mock data |
| Admin CRUD | All | ❌ | |

## Classes (`/api/classes`) ✅
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| CRUD | All | ✅ | classService.* |
| Schedules | All | ✅ | classService.* |
| Attendance | All | ✅ | classService.* |

## Organizations (`/api/organizations`) ✅
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| CRUD | All | ✅ | organizationService.* |

## Roles (`/api/org-roles`, `/api/system-roles`) ✅
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| All | All | ✅ | roleService.* |

## Permissions (`/api/permissions`) ✅
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| All | All | ✅ | roleService.* |

## Livestream (`/api/livestream`) ✅
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| CRUD + actions | Most | ✅ | livestreamService.* |
| Screenshare | start/stop | ❌ | - |

## Chat (`/api/chat`) ✅
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| All | All | ✅ | livestreamService.* |

## Whiteboard (`/api/whiteboard`) ✅
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| All | All | ✅ | livestreamService.* |

## Video Upload (`/api/videos`) ⚠️
| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| All | All | ⚠️ | API structure outdated |

## HLS (`/api/hls`) ⚠️
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| All | All | ⚠️ | videoService.* (partial) |

## Assignments (`/api/assignments`) ⚠️
| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| All | All | ⚠️ | In livestreamService |

## Submissions (`/api/submissions`) ⚠️
| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| All | All | ⚠️ | In livestreamService |

## Teachers (`/api/teachers`) ❌
| Method | Endpoint | Status |
|--------|----------|--------|
| All | All | ❌ |

## Teacher Profiles (`/api/teacher-profiles`) ❌
| Method | Endpoint | Status |
|--------|----------|--------|
| All | All | ❌ |

## Upload (`/api/upload`) ❌
| Method | Endpoint | Status |
|--------|----------|--------|
| POST | `/upload` | ❌ |
| POST | `/upload/any` | ❌ |
| DELETE | `/upload` | ❌ |

## Analytics (`/api/analytics`) ❌
| Method | Endpoint | Status |
|--------|----------|--------|
| All | All | ❌ |

---

## Summary

| Module | Endpoints | Integrated | Partial | Missing |
|--------|-----------|------------|---------|---------|
| Auth | 17 | 15 | 0 | 2 |
| Courses | 5 | 2 | 0 | 3 |
| Sections | 5 | 0 | 0 | 5 |
| Lessons | 5 | 0 | 0 | 5 |
| Lesson Content | 11 | 0 | 0 | 11 |
| Enrollments | 5 | 2 | 1 | 2 |
| Categories | 5 | 1 | 0 | 4 |
| Tags | 3 | 0 | 0 | 3 |
| Cart | 5 | 0 | 0 | 5 |
| Orders | 7 | 0 | 0 | 7 |
| Vouchers | 14 | 0 | 1 | 13 |
| Classes | 17 | 17 | 0 | 0 |
| Organizations | 5 | 5 | 0 | 0 |
| Roles | 20 | 20 | 0 | 0 |
| Livestream | 16 | 14 | 0 | 2 |
| Chat | 5 | 5 | 0 | 0 |
| Whiteboard | 3 | 3 | 0 | 0 |
| Video | 10 | 0 | 10 | 0 |
| Assignments | 12 | 0 | 12 | 0 |
| Submissions | 8 | 0 | 8 | 0 |
| Teachers | 3 | 0 | 0 | 3 |
| Teacher Profiles | 5 | 0 | 0 | 5 |
| Upload | 3 | 0 | 0 | 3 |
| Analytics | 3 | 0 | 0 | 3 |
| **Total** | ~187 | ~84 | ~32 | ~71 |

**Coverage**: ~45% integrated, ~17% partial, ~38% missing
