# Backend API Checklist

> Đối chiếu API backend (nguồn chuẩn: **các file route trong `backend/internal/router/*.go`**) với web frontend integration (`web/src/services/*.service.ts` + hooks).
> Cập nhật: 2026-08-08

## Legend
- ✅ Integrated (có service + hooks đầy đủ)
- ⚠️ Partial (backend có endpoint nhưng web chưa có service / dùng path khác / service gọi endpoint backend chưa implement)
- ❌ Missing (backend có nhưng web chưa tích hợp)
- 🆕 Extra (web gọi endpoint KHÔNG có trong backend router — rủi ro 404)

> **Lưu ý:** Ngày 2026-08-08 đã rà lại theo **route thực tế của Go router** (không chỉ theo `API_DOCUMENTATION.md`). Phát hiện:
> - `API_DOCUMENTATION.md` có 4 module mô tả NHƯNG **không được register trong router**: Live Sessions (`/live-sessions/*`), LiveKit (`/livekit/*`), Schedule Events (`/schedule/events/*`), Parent Notifications (`/parent-notifications/*`) — web vẫn gọi các endpoint này.
> - **Exercises** (`/exercises/*`) và **Contests** (`/contests/*`) được register trong router NHƯNG **chưa có trong API_DOCUMENTATION.md**.

---

# PHẦN A — Endpoint đã register trong backend router

## 1. Authentication & Authorization

### 1.1 Auth Core
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/auth/register/request` | ✅ | authService.registerRequest |
| POST | `/auth/register` | ✅ | authService.register |
| POST | `/auth/login` | ✅ | authService.login |
| POST | `/auth/select-role` | ✅ | authService.selectRole |
| POST | `/auth/refresh-token` | ✅ | authService.refreshToken (cả axios interceptor) |
| POST | `/auth/reset-password/request` | ✅ | authService.resetPasswordRequest |
| POST | `/auth/reset-password` | ✅ | authService.resetPassword |
| GET | `/auth/system-roles` | ✅ | authService.getAllSystemRoles |
| POST | `/auth/switch-role` | ✅ | authService.switchRole |
| GET | `/auth/my-roles` | ✅ | authService.getMyRoles |

### 1.2 OAuth
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/auth/oauth/:provider` | ✅ | authService.startOAuthFlow (redirect browser) |
| GET | `/auth/oauth/:provider/callback` | ✅ | Handled by backend |
| GET | `/auth/linked-accounts` | ✅ | authService.getLinkedAccounts |
| DELETE | `/auth/linked-accounts/:provider` | ✅ | authService.disconnectProvider |

### 1.3 User Profile
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/auth/me` | ✅ | authService.getMe |
| PUT | `/auth/me` | ✅ | authService.updateProfile |
| DELETE | `/auth/me` | ✅ | authService.deleteAccount |
| GET | `/auth/me/profiles` | ✅ | authService.getMyProfiles |
| POST | `/auth/me/profiles` | ✅ | authService.createProfile |
| DELETE | `/auth/me/profiles/:id` | ✅ | authService.deleteProfile |

### 1.4 Devices & Sessions
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/auth/devices` | ✅ | authService.getDevices |
| POST | `/auth/logout` | ✅ | authService.logout |
| POST | `/auth/logout-all` | ✅ | authService.logoutAll |
| PUT | `/auth/change-password` | ✅ | authService.changePassword |

### 1.5 Me Extra
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/me/children` | ✅ | authService.getChildren |
| GET | `/me/organizations` | ✅ | authService.getMyOrganizations |
| GET | `/me/org-roles` | ❌ | - |
| GET | `/me/system-roles` | ✅ | roleService.getMySystemRoles |

**Auth subtotal: 27/28 integrated**

---

## 2. Role & Permission Management

### 2.1 System Roles
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/system-roles` (public) | ✅ | roleService.listSystemRoles |
| POST | `/system-roles` | ✅ | roleService.createSystemRole |
| GET | `/system-roles/:id` | ✅ | roleService.getSystemRole |
| PUT | `/system-roles/:id` | ✅ | roleService.updateSystemRole |
| DELETE | `/system-roles/:id` | ✅ | roleService.deleteSystemRole |
| PATCH | `/system-roles/:id/restore` | ✅ | roleService.restoreSystemRole |
| GET | `/system-roles/:id/permissions` | ✅ | roleService.getSystemRolePermissions |
| POST | `/system-roles/:id/permissions` | ✅ | roleService.addSystemRolePermissions |
| PUT | `/system-roles/:id/permissions` | ✅ | roleService.setSystemRolePermissions |
| DELETE | `/system-roles/:id/permissions` | ✅ | roleService.removeSystemRolePermissions |
| GET | `/system-roles/:system_role_id/users` | ✅ | roleService.getSystemRoleUsers |

### 2.2 Organization Roles
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/org-roles` | ✅ | roleService.createOrgRole |
| GET | `/org-roles` | ✅ | roleService.listOrgRoles |
| GET | `/org-roles/:id` | ✅ | roleService.getOrgRole |
| PUT | `/org-roles/:id` | ✅ | roleService.updateOrgRole |
| DELETE | `/org-roles/:id` | ✅ | roleService.deleteOrgRole |
| PATCH | `/org-roles/:id/restore` | ✅ | roleService.restoreOrgRole |
| GET | `/org-roles/:id/permissions` | ✅ | roleService.getOrgRolePermissions |
| POST | `/org-roles/:id/permissions` | ✅ | roleService.addOrgRolePermissions |
| PUT | `/org-roles/:id/permissions` | ✅ | roleService.setOrgRolePermissions |
| DELETE | `/org-roles/:id/permissions` | ✅ | roleService.removeOrgRolePermissions |
| GET | `/org-roles/:role_id/users` | ✅ | roleService.getOrgRoleUsers |

### 2.3 User-Role Mapping
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/users/:user_id/system-roles` | ✅ | roleService.getUserSystemRoles |
| POST | `/users/:user_id/system-roles` | ✅ | roleService.assignSystemRoles |
| DELETE | `/users/:user_id/system-roles/:system_role_id` | ✅ | roleService.revokeSystemRole |
| GET | `/users/:user_id/org-roles` | ✅ | roleService.getUserOrgRoles |
| POST | `/users/:user_id/org-roles` | ✅ | roleService.assignOrgRoles |
| DELETE | `/users/:user_id/org-roles/:org_role_id` | ✅ | roleService.revokeOrgRole |

### 2.4 Permissions
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/permissions` | ✅ | permissionService.getAll |
| GET | `/permissions/:id` | ✅ | permissionService.getById |
| PUT | `/permissions/:id` | ✅ | permissionService.update |

**Role subtotal: 31/31**

---

## 3. Organizations
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/organizations` | ✅ | organizationService.create |
| GET | `/organizations` | ✅ | organizationService.list |
| GET | `/organizations/:id` | ✅ | organizationService.getById |
| PUT | `/organizations/:id` | ✅ | organizationService.update |
| DELETE | `/organizations/:id` | ✅ | organizationService.delete |
| GET | `/organizations/:organization_id/members` | ✅ | organizationService.getMembers |
| GET | `/organizations/:organization_id/roles/:role_id/users` | ✅ | organizationService.getUsersByRole |

**Organizations: 7/7**

---

## 4. Courses

### 4.1 Course CRUD
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/courses` | ✅ | courseService.getCourses / searchCourses / getMyCourses / getFeaturedCourses |
| GET | `/courses/slug/:slug` | ✅ | courseService.getCourseBySlug (+ server-fetcher) |
| GET | `/courses/:id` | ✅ | courseService.getCourseById |
| POST | `/courses` | ✅ | courseService.createCourse |
| PUT | `/courses/:id` | ✅ | courseService.updateCourse |
| DELETE | `/courses/:id` | ✅ | courseService.deleteCourse |

### 4.2 Sections
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/courses/:course_id/sections` | ✅ | sectionService.createSection |
| GET | `/courses/:course_id/sections` | ✅ | sectionService.getSections |
| GET | `/courses/:course_id/sections/:id` | ✅ | sectionService.getSection |
| PUT | `/courses/:course_id/sections/reorder` | ✅ | sectionService.reorderSections |
| PUT | `/courses/:course_id/sections/:id` | ✅ | sectionService.updateSection |
| DELETE | `/courses/:course_id/sections/:id` | ✅ | sectionService.deleteSection |

### 4.3 Lessons
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/sections/:section_id/lessons` | ✅ | lessonService.createLesson |
| GET | `/sections/:section_id/lessons` | ✅ | lessonService.getLessons |
| PUT | `/sections/:section_id/lessons/reorder` | ✅ | lessonService.reorderLessons |
| GET | `/lessons/:id` | ✅ | lessonService.getLesson |
| PUT | `/lessons/:id` | ✅ | lessonService.updateLesson |
| DELETE | `/lessons/:id` | ✅ | lessonService.deleteLesson |

### 4.4 Lesson Content
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/lessons/:lesson_id/contents` | ✅ | lessonContentService.createContent |
| GET | `/lessons/:lesson_id/contents` | ✅ | lessonContentService.getContents |
| PUT | `/lessons/:lesson_id/contents/reorder` | ✅ | lessonContentService.reorderContents |
| PUT | `/lessons/:lesson_id/contents/:id` | ✅ | lessonContentService.updateContent |
| DELETE | `/lessons/:lesson_id/contents/:id` | ✅ | lessonContentService.deleteContent |

### 4.5 Lesson-Content ↔ Class (Content Schedule)
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/lesson-contents/:id/classes/bulk` | ✅ | lessonContentService.bulkAssignToClasses |
| POST | `/lesson-contents/:id/classes` | ✅ | lessonContentService.assignToClass |
| GET | `/lesson-contents/:id/classes` | ✅ | lessonContentService.getClassSchedules |
| PUT | `/lesson-contents/:id/classes/:class_id` | ✅ | lessonContentService.updateClassSchedule |
| DELETE | `/lesson-contents/:id/classes/:class_id` | ✅ | lessonContentService.removeFromClass |

### 4.6 Courses ↔ Classes (nested)
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/courses/:course_id/classes` | ✅ | classService.list |
| POST | `/courses/:course_id/classes` | ✅ | classService.create |
| GET | `/courses/:course_id/classes/:id` | ✅ | classService.getById |
| PUT | `/courses/:course_id/classes/:id` | ✅ | classService.update |
| DELETE | `/courses/:course_id/classes/:id` | ✅ | classService.delete |
| POST | `/courses/:course_id/classes/:id/teachers` | ✅ | classService.addTeacher |
| DELETE | `/courses/:course_id/classes/:id/teachers/:teacherId` | ✅ | classService.removeTeacher |
| GET | `/courses/:course_id/classes/:id/teachers` | ✅ | classService.getTeachers |
| POST | `/courses/:course_id/classes/:id/students` | ✅ | classService.addStudent |
| DELETE | `/courses/:course_id/classes/:id/students/:studentId` | ✅ | classService.removeStudent |
| GET | `/courses/:course_id/classes/:id/students` | ✅ | classService.getStudents |
| GET | `/courses/:course_id/classes/:id/contents` | ✅ | classService.getContents |
| POST | `/courses/:course_id/classes/:classId/attendances` | ✅ | classService.createAttendance |
| GET | `/courses/:course_id/classes/:classId/attendances` | ✅ | classService.getAttendances |
| GET | `/courses/:course_id/classes/:classId/attendances/:id` | ✅ | classService.getAttendance |
| PUT | `/courses/:course_id/classes/:classId/attendances/:id` | ✅ | classService.updateAttendance |
| DELETE | `/courses/:course_id/classes/:classId/attendances/:id` | ✅ | classService.deleteAttendance |

### 4.7 Categories & Tags
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/categories` | ✅ | categoryService.getAll |
| GET | `/categories/:id` | ✅ | categoryService.getById |
| POST | `/categories` | ✅ | categoryService.create |
| PUT | `/categories/:id` | ✅ | categoryService.update |
| DELETE | `/categories/:id` | ✅ | categoryService.delete |
| GET | `/tags` | ✅ | categoryService.getAllTags |
| GET | `/tags/:id` | ✅ | categoryService.getTagById |
| POST | `/tags` | ✅ | categoryService.createTag |
| PUT | `/tags/:id` | ✅ | categoryService.updateTag |
| DELETE | `/tags/:id` | ✅ | categoryService.deleteTag |

**Courses subtotal: 55/55**

---

## 5. Classes (root scope)
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/classes` | ⚠️ | Web dùng `POST /courses/:courseId/classes` (classService.create) |
| GET | `/classes` (public) | ⚠️ | Web không gọi trực tiếp (dùng `GET /courses/:courseId/classes`) |
| GET | `/classes/me` | ❌ | - |
| GET | `/classes/:id` | ⚠️ | Web dùng `GET /courses/:courseId/classes/:id` |
| PUT | `/classes/:id` | ⚠️ | Web dùng `PUT /courses/:courseId/classes/:id` |
| DELETE | `/classes/:id` | ⚠️ | Web dùng `DELETE /courses/:courseId/classes/:id` |
| POST | `/classes/:id/teachers` | ⚠️ | Web dùng scoped theo course |
| DELETE | `/classes/:id/teachers/:teacherId` | ⚠️ | Web dùng scoped theo course |
| GET | `/classes/:id/teachers` | ⚠️ | Web dùng scoped theo course |
| POST | `/classes/:id/students` | ⚠️ | Web dùng scoped theo course |
| DELETE | `/classes/:id/students/:studentId` | ⚠️ | Web dùng scoped theo course |
| GET | `/classes/:id/students` | ✅ | classService.getStudentsByClassId |
| POST | `/classes/:classId/attendances` | ⚠️ | Web dùng scoped theo course |
| GET | `/classes/:classId/attendances` | ⚠️ | Web dùng scoped theo course |
| GET | `/classes/:classId/attendances/:id` | ⚠️ | Web dùng scoped theo course |
| PUT | `/classes/:classId/attendances/:id` | ⚠️ | Web dùng scoped theo course |
| DELETE | `/classes/:classId/attendances/:id` | ⚠️ | Web dùng scoped theo course |

**Classes subtotal: 1/17 dùng trực tiếp, phần lớn qua path scoped**

---

## 6. Enrollment & Progress
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/courses/:courseId/enroll` | ✅ | enrollmentService.enroll / courseService.enroll |
| DELETE | `/courses/:courseId/enroll` | ✅ | enrollmentService.unenroll |
| GET | `/enrollments` | ✅ | enrollmentService.getAll / courseService.getEnrolledCourses |
| GET | `/enrollments/:id` | ✅ | enrollmentService.getById |
| PUT | `/lessons/:lessonId/progress` | ✅ | enrollmentService.updateProgress |
| GET | `/courses/:courseId/enrollments` | ✅ | enrollmentService (hook use-enrollments) |
| GET | `/courses/:courseId/enrollments/debug` | ⚠️ | Chỉ dùng debug backend |

**Enrollment subtotal: 7/7**

---

## 7. Cart & Orders

### 7.1 Cart
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/cart` | ✅ | cartService.getCart |
| POST | `/cart` | ✅ | cartService.addToCart |
| DELETE | `/cart` | ✅ | cartService.removeFromCart |
| DELETE | `/cart/clear` | ✅ | cartService.clearCart |
| GET | `/cart/check/:courseID` | ✅ | cartService.isInCart |

### 7.2 Orders
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/orders` | ✅ | orderService.createOrder |
| GET | `/orders/me` | ✅ | orderService.getMyOrders |
| GET | `/orders/:id` | ✅ | orderService.getOrder |
| POST | `/orders/:id/cancel` | ✅ | orderService.cancelOrder |
| POST | `/orders/:id/payment-intent` | ✅ | orderService.createPaymentIntent |
| GET | `/orders/:id/payment-status` | ✅ | orderService.getPaymentStatus |
| POST | `/orders/:id/check-payment` | ✅ | orderService.checkPayment |

**Cart & Orders: 12/12**

---

## 8. Vouchers
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/vouchers/public` | ✅ | voucherService.getPublicVouchers |
| GET | `/vouchers/code/:code` | ✅ | voucherService.getVoucherByCode |
| GET | `/vouchers/me` | ✅ | voucherService.getMyVouchers |
| POST | `/vouchers/:id/save` | ✅ | voucherService.saveVoucher |
| DELETE | `/vouchers/:id/save` | ✅ | voucherService.unsaveVoucher |
| POST | `/vouchers` | ✅ | voucherService.createVoucher |
| GET | `/vouchers` | ✅ | voucherService.getAllVouchers |
| GET | `/vouchers/:id` | ✅ | voucherService.getVoucherById |
| PUT | `/vouchers/:id` | ✅ | voucherService.updateVoucher |
| DELETE | `/vouchers/:id` | ✅ | voucherService.deleteVoucher |
| POST | `/vouchers/:id/restore` | ✅ | voucherService.restoreVoucher |
| POST | `/vouchers/:id/activate` | ✅ | voucherService.activateVoucher |
| POST | `/vouchers/:id/deactivate` | ✅ | voucherService.deactivateVoucher |
| GET | `/vouchers/:id/stats` | ✅ | voucherService.getVoucherStats |

**Vouchers: 14/14**

---

## 9. Teachers
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/teachers` | ✅ | teacherService.list |
| GET | `/teachers/:id` | ✅ | teacherService.getById |
| DELETE | `/teachers/:id` | ✅ | teacherService.delete |
| GET | `/teachers/me/students` | ✅ | teacherService.getMyStudents |
| POST | `/teacher-profiles` | ✅ | teacherService.createProfile |
| GET | `/teacher-profiles` | ✅ | teacherService.listProfiles |
| GET | `/teacher-profiles/:id` | ✅ | teacherService.getProfile |
| PUT | `/teacher-profiles/:id` | ✅ | teacherService.updateProfile |
| DELETE | `/teacher-profiles/:id` | ✅ | teacherService.deleteProfile |

**Teachers: 9/9**

---

## 10. File Upload & Media

### 10.1 Basic Upload
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/upload` | ✅ | api.upload (live room: AssignmentWorkOverlay, ExercisePanel, MiniExcalidraw; course create thumbnail) |
| POST | `/upload/any` | ❌ | - |
| DELETE | `/upload` | ❌ | - |

### 10.2 Video Upload
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/videos/health` | ✅ | videoUploadService.health |
| POST | `/videos/upload/init` | ✅ | videoUploadService.initUpload |
| POST | `/videos/upload/presigned-urls` | ✅ | videoUploadService.getPresignedUrls |
| POST | `/videos/upload/chunk-complete` | ✅ | videoUploadService.chunkComplete |
| POST | `/videos/upload/complete` | ✅ | videoUploadService.completeUpload |
| GET | `/videos/upload/:upload_id/status` | ✅ | videoUploadService.getUploadStatus |
| GET | `/videos/upload/:upload_id/resume` | ✅ | videoUploadService.getResumeInfo |
| GET | `/videos/upload/incomplete` | ✅ | videoUploadService.getIncompleteUploads |
| DELETE | `/videos/upload/:upload_id` | ✅ | videoUploadService.cancelUpload |
| POST | `/videos/upload/:upload_id/reprocess` | ❌ | - |
| GET | `/videos/processing/queue` | ✅ | videoUploadService.getProcessingQueue |

### 10.3 HLS Streaming
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/hls/:upload_id/info` | ✅ | hlsService.getInfo |
| GET | `/hls/:upload_id/master.m3u8` | ✅ | hlsService.getMasterPlaylistUrl (HLS player) |
| GET | `/hls/:upload_id/video.mp4` | ✅ | hlsService.getFallbackVideoUrl |
| GET | `/hls/:upload_id/:quality/index.m3u8` | ✅ | hlsService.getQualityPlaylistUrl |
| GET | `/hls/:upload_id/:quality/:segment` | ✅ | hlsService.getSegmentUrl |

**Upload & Media: 16/19**

---

## 11. Livestream
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/livestream` | ✅ | livestreamService.create |
| GET | `/livestream` | ✅ | livestreamService.getAll / livestreamClassroomService.listSessions |
| GET | `/livestream/:id` | ✅ | livestreamService.getById / livestreamClassroomService.getSession |
| PUT | `/livestream/:id` | ✅ | livestreamService.update |
| DELETE | `/livestream/:id` | ✅ | livestreamService.delete |
| POST | `/livestream/:id/start` | ✅ | livestreamService.start |
| POST | `/livestream/:id/end` | ✅ | livestreamService.end |
| POST | `/livestream/:id/join` | ✅ | livestreamService.join |
| POST | `/livestream/:id/leave` | ✅ | livestreamService.leave |
| GET | `/livestream/:id/participants` | ✅ | livestreamService.getParticipants / livestreamClassroomService.getParticipants |
| POST | `/livestream/:id/mute` | ✅ | livestreamService.mute |
| POST | `/livestream/:id/kick` | ✅ | livestreamService.kick |
| POST | `/livestream/:id/lock-whiteboard` | ✅ | livestreamService.lockWhiteboard |
| POST | `/livestream/:id/unlock-whiteboard` | ✅ | livestreamService.unlockWhiteboard |
| POST | `/livestream/:id/screenshare/start` | ✅ | livestreamService.startScreenShare |
| POST | `/livestream/:id/screenshare/stop` | ✅ | livestreamService.stopScreenShare |

**Livestream: 16/16**

---

## 12. Chat & Whiteboard

### 12.1 Chat
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/chat/send` | ✅ | chatService.sendMessage |
| GET | `/chat/:sessionId/messages` | ✅ | chatService.getMessages |
| DELETE | `/chat/:id` | ✅ | chatService.deleteMessage |
| POST | `/chat/:id/pin` | ✅ | chatService.pinMessage |
| POST | `/chat/:id/unpin` | ✅ | chatService.unpinMessage |

### 12.2 Whiteboard
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/whiteboard/:sessionId/snapshot` | ✅ | whiteboardService.getSnapshot |
| POST | `/whiteboard/:sessionId/snapshot` | ✅ | whiteboardService.saveSnapshot |
| POST | `/whiteboard/:sessionId/event` | ✅ | whiteboardService.sendEvent |

**Chat & Whiteboard: 8/8**

---

## 13. Assignments & Submissions

### 13.1 Assignments
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/assignments` | ✅ | assignmentService.create |
| GET | `/assignments` | ✅ | assignmentService (theo session) / livestreamClassroomService.getAssignments |
| GET | `/assignments/:id` | ✅ | assignmentService.getById |
| GET | `/assignments/:id/sandbox` | ✅ | assignmentService.getSandbox |
| PUT | `/assignments/:id` | ✅ | assignmentService.update |
| DELETE | `/assignments/:id` | ✅ | assignmentService.delete |
| POST | `/assignments/:id/publish` | ✅ | assignmentService.publish |
| POST | `/assignments/:id/unpublish` | ✅ | assignmentService.unpublish |
| GET | `/assignments/:id/testcases` | ✅ | assignmentService.getTestCases |
| POST | `/assignments/:id/testcases` | ✅ | assignmentService.createTestCase |
| POST | `/assignments/:id/testcases/import` | ✅ | assignmentService.importTestCases |
| DELETE | `/assignments/:id/testcases/:tcId` | ✅ | assignmentService.deleteTestCase |

### 13.2 Submissions
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/submissions` | ✅ | submissionService.submit |
| POST | `/submissions/run` | ✅ | submissionService.run |
| POST | `/submissions/run-custom` | ✅ | submissionService.runCustom |
| POST | `/submissions/execute` | ⚠️ | Web sandbox gọi Judge0 trực tiếp (không qua backend) |
| GET | `/submissions/:id` | ✅ | submissionService.getById |
| GET | `/submissions/assignment/:assignmentId` | ✅ | submissionService.getByAssignment |
| GET | `/submissions/my/:assignmentId` | ✅ | submissionService.getMySubmissions |
| GET | `/submissions/user/:userId` | ✅ | submissionService.getByUser |

**Assignments & Submissions: 20/20**

---

## 14. Analytics
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/analytics/livestream/:sessionId` | ✅ | analyticsService.getLivestreamAnalytics |
| GET | `/analytics/assignment/:assignmentId` | ✅ | analyticsService.getAssignmentAnalytics |
| GET | `/analytics/participants/:sessionId` | ✅ | analyticsService.getParticipantAnalytics |

**Analytics: 3/3**

---

## 15. Gamification
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/achievements` | ✅ | achievementService.getAll |
| GET | `/achievements/me` | ✅ | achievementService.getMyAchievements |
| POST | `/achievements/:id/unlock` | ✅ | achievementService.unlock |
| GET | `/leaderboard` | ✅ | leaderboardService.getLeaderboard |
| GET | `/leaderboard/me` | ✅ | leaderboardService.getMyRank |
| GET | `/users/:id/public-profile` | ✅ | userStatsService.getPublicProfile / authService.getPublicProfile |

**Gamification: 6/6**

---

## 16. Wallet
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/wallet/me` | ✅ | walletService.getWallet |
| GET | `/wallet/transactions` | ✅ | walletService.getTransactions |
| GET | `/wallet/teacher/me` | ✅ | walletService.getTeacherWallet |
| GET | `/wallet/teacher/transactions` | ✅ | walletService.getTeacherTransactions |
| PUT | `/wallet/teacher/bank-info` | ✅ | walletService.updateBankInfo |

**Wallet: 5/5**

---

## 17. Parent Invitations
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/invitations/validate/:token` | ✅ | invitationService.validateToken |
| POST | `/invitations/invite` | ✅ | invitationService.invite |
| GET | `/invitations/pending` | ✅ | invitationService.getPending |
| GET | `/invitations/sent` | ✅ | invitationService.getSent |
| POST | `/invitations/:id/respond` | ✅ | invitationService.respond |
| POST | `/invitations/:id/revoke` | ✅ | invitationService.revoke |

**Parent Invitations: 6/6**

---

## 18. Discussion Forum
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/discussions` | ✅ | discussionService.listPosts |
| GET | `/discussions/:slug` | ✅ | discussionService.getPostBySlug |
| POST | `/discussions` | ✅ | discussionService.createPost |
| POST | `/discussions/:slug/comments` | ✅ | discussionService.addComment |
| POST | `/discussions/:id/vote` | ✅ | discussionService.vote |
| DELETE | `/discussions/:id/vote` | ✅ | discussionService.removeVote |
| DELETE | `/discussions/:id` | ✅ | discussionService.deletePost |

**Discussion: 7/7**

---

## 19. Notifications
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/notifications` | ✅ | notificationService.list |
| GET | `/notifications/unread-count` | ✅ | notificationService.getUnreadCount |
| GET | `/notifications/settings` | ✅ | notificationService.getSettings |
| PUT | `/notifications/settings` | ✅ | notificationService.updateSettings |
| PATCH | `/notifications/read-all` | ✅ | notificationService.markAllAsRead |
| PATCH | `/notifications/:id/read` | ✅ | notificationService.markAsRead |
| DELETE | `/notifications/:id` | ✅ | notificationService.delete |
| POST | `/notifications/send` | ❌ | - (backend có; web dùng `/parent-notifications/*` thay thế) |

**Notifications: 7/8**

---

## 20. User Preferences
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/preferences/privacy` | ✅ | userPreferenceService.getPrivacySettings |
| PUT | `/preferences/privacy` | ✅ | userPreferenceService.updatePrivacySettings |

**User Preferences: 2/2**

---

## 21. Schedule / Sessions / Timetable / Reminders
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/classes/:classId/schedules` | ✅ | sessionService.createSchedule |
| GET | `/classes/:classId/schedules` | ✅ | sessionService.getSchedules |
| GET | `/classes/:classId/schedules/:id` | ✅ | sessionService.getSchedule |
| PUT | `/classes/:classId/schedules/:id` | ✅ | sessionService.updateSchedule |
| DELETE | `/classes/:classId/schedules/:id` | ✅ | sessionService.deleteSchedule |
| GET | `/classes/:classId/timetable` | ✅ | sessionService.getClassTimetable |
| POST | `/classes/:classId/sessions` | ✅ | sessionService.createSession |
| POST | `/classes/:classId/sessions/generate` | ✅ | sessionService.generateSessions |
| GET | `/classes/:classId/sessions` | ✅ | sessionService.getSessions |
| GET | `/classes/:classId/sessions/:id` | ✅ | sessionService.getSession |
| PUT | `/classes/:classId/sessions/:id` | ✅ | sessionService.updateSession |
| DELETE | `/classes/:classId/sessions/:id` | ✅ | sessionService.cancelSession |
| GET | `/sessions/:sessionId/attendances` | ✅ | sessionService.getAttendances |
| POST | `/sessions/:sessionId/attendances` | ✅ | sessionService.markAttendance |
| POST | `/sessions/:sessionId/attendances/bulk` | ✅ | sessionService.bulkMarkAttendance |
| PUT | `/sessions/:sessionId/attendances/:id` | ✅ | sessionService.updateAttendance |
| POST | `/sessions/:sessionId/check-in` | ✅ | sessionService.checkIn |
| POST | `/sessions/:sessionId/check-out` | ✅ | sessionService.checkOut |
| GET | `/me/timetable` | ✅ | sessionService.getMyTimetable |
| GET | `/me/attendances` | ✅ | sessionService.getMyAttendances |
| GET | `/reminders/settings` | ✅ | sessionService.getReminderSettings |
| PUT | `/reminders/settings` | ✅ | sessionService.updateReminderSettings |

**Schedule & Sessions: 22/22**

---

## 22. Quizzes
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/quizzes` | ✅ | quizService.create |
| GET | `/quizzes` | ❌ | - |
| GET | `/quizzes/:id` | ✅ | quizService.getById |
| PUT | `/quizzes/:id` | ✅ | quizService.update |
| DELETE | `/quizzes/:id` | ✅ | quizService.delete |
| POST | `/quizzes/:id/duplicate` | ❌ | - |
| POST | `/quizzes/:quizId/questions` | ✅ | quizService.createQuestion |
| GET | `/quizzes/:quizId/questions` | ✅ | quizService.getQuestions |
| PUT | `/quizzes/:quizId/questions/:id` | ❌ | - |
| DELETE | `/quizzes/:quizId/questions/:id` | ✅ | quizService.deleteQuestion |
| PUT | `/quizzes/:quizId/questions/reorder` | ❌ | - |
| POST | `/quizzes/:quizId/questions/bulk` | ❌ | - |
| POST | `/quizzes/:id/start` | ✅ | quizService.startQuiz |
| POST | `/quizzes/:id/submit` | ✅ | quizService.submitQuiz |
| GET | `/quizzes/:id/attempts` | ✅ | quizService.getMyAttempts |
| GET | `/quizzes/:id/attempts/:attemptId` | ✅ | quizService.getAttemptDetail |
| GET | `/quizzes/:id/results` | ✅ | quizService.getQuizResults |
| GET | `/quizzes/:id/statistics` | ❌ | - |
| POST | `/attempts/:attemptId/save-answer` | ✅ | quizService.saveAnswer |
| GET | `/attempts/:attemptId/progress` | ✅ | quizService.getAttemptProgress |
| GET | `/me/quizzes` | ❌ | - |
| GET | `/me/quiz-history` | ❌ | - |

> ⚠️ `quizService.getByLesson` (`/lessons/:lessonId/quizzes`) và `getBySession` (`/sessions/:sessionId/quizzes`), `trigger` (`POST /quizzes/:quizId/trigger`) — **web có gọi NHƯNG KHÔNG có trong router backend**. Được liệt kê ở Phần B.

**Quizzes: 13/21 registered + 3 web-only**

---

## 23. Grades
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/classes/:classId/grade-columns` | ✅ | gradeService.createColumn |
| GET | `/classes/:classId/grade-columns` | ✅ | gradeService.getColumns |
| PUT | `/classes/:classId/grade-columns/:id` | ✅ | gradeService.updateColumn |
| DELETE | `/classes/:classId/grade-columns/:id` | ✅ | gradeService.deleteColumn |
| PUT | `/classes/:classId/grade-columns/reorder` | ✅ | gradeService.reorderColumns |
| POST | `/classes/:classId/grades` | ✅ | gradeService.createGrade |
| POST | `/classes/:classId/grades/bulk` | ✅ | gradeService.bulkCreateGrades |
| GET | `/classes/:classId/grades` | ✅ | gradeService.getGradeBook |
| GET | `/classes/:classId/grades/student/:studentId` | ✅ | gradeService.getStudentGrades |
| PUT | `/grades/:id` | ✅ | gradeService.updateGrade |
| DELETE | `/grades/:id` | ✅ | gradeService.deleteGrade |
| POST | `/classes/:classId/final-grades/calculate` | ✅ | gradeService.calculateFinalGrades |
| GET | `/classes/:classId/final-grades` | ✅ | gradeService.getFinalGrades |
| PUT | `/classes/:classId/final-grades/:id` | ✅ | gradeService.updateFinalGrade |
| POST | `/classes/:classId/final-grades/finalize` | ✅ | gradeService.finalizeFinalGrades |
| GET | `/me/grades` | ✅ | gradeService.getMyGrades |
| GET | `/me/grades/class/:classId` | ✅ | gradeService.getMyGradesInClass |

**Grades: 17/17**

---

## 24. Exercises
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/exercises` | ✅ | exerciseService.create |
| GET | `/exercises` | ⚠️ | Web chưa có list trực tiếp trong service |
| GET | `/exercises/:id` | ✅ | exerciseService.getById (use-course-player) |
| PUT | `/exercises/:id` | ✅ | exerciseService.update |
| DELETE | `/exercises/:id` | ✅ | exerciseService.delete |
| GET | `/exercises/:id/testcases` | ✅ | exerciseService.getTestCases |
| POST | `/exercises/:id/testcases` | ✅ | exerciseService.createTestCase |
| POST | `/exercises/:id/testcases/import` | ✅ | exerciseService.importTestCases |
| DELETE | `/exercises/:id/testcases/:testCaseId` | ✅ | exerciseService.deleteTestCase |
| POST | `/exercises/:id/submit` | ✅ | exerciseService.submit |
| GET | `/exercises/:id/submissions` | ✅ | exerciseService.getSubmissions |
| GET | `/exercises/:id/my-submissions` | ❌ | - |
| GET | `/submissions/:submissionId` | ✅ | submissionService.getById |
| POST | `/content-progress` | ❌ | - |
| GET | `/content-progress/:lessonContentId` | ❌ | - |

**Exercises: 11/15**

---

## 25. Reviews
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/courses/:courseId/reviews` | ✅ | reviewService.list |
| POST | `/courses/:courseId/reviews` | ✅ | reviewService.create |
| PUT | `/reviews/:id` | ✅ | reviewService.update |
| DELETE | `/reviews/:id` | ✅ | reviewService.delete |
| POST | `/reviews/:id/reaction` | ✅ | reviewService.addReaction |
| DELETE | `/reviews/:id/reaction` | ✅ | reviewService.removeReaction |

**Reviews: 6/6**

---

## 26. Certificates
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/certificates` | ✅ | certificateService.issue |
| GET | `/certificates` | ✅ | certificateService.list |
| GET | `/certificates/:id` | ✅ | certificateService.getById |
| GET | `/certificates/verify/:number` | ✅ | certificateService.verify (+ server-fetcher) |

**Certificates: 4/4**

---

## 27. Reports
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/reports` | ✅ | reportService.create |
| GET | `/reports/my` | ✅ | reportService.getMyReports |
| GET | `/reports` | ✅ | reportService.list |
| GET | `/reports/:id` | ✅ | reportService.getById |
| PUT | `/reports/:id/status` | ✅ | reportService.updateStatus |
| DELETE | `/reports/:id` | ✅ | reportService.delete |

**Reports: 6/6**

---

## 28. Coins
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/coins/packages` (public) | ✅ | coinService.listPackages |
| GET | `/coins/packages/:id` (public) | ✅ | coinService.getPackage |
| GET | `/coins/wallet` | ✅ | coinService.getWallet |
| GET | `/coins/wallet/transactions` | ✅ | coinService.getTransactions |
| POST | `/coins/purchases` | ✅ | coinService.createPurchase |
| GET | `/coins/purchases` | ✅ | coinService.listPurchases |
| GET | `/coins/purchases/:id` | ✅ | coinService (use-coins) |
| POST | `/coins/purchases/:id/verify` | ✅ | coinService.verifyPurchase |
| POST | `/coins/gift` | ✅ | coinService.sendGift |
| POST | `/coins/admin/packages` | ❌ | - |
| PUT | `/coins/admin/packages/:id` | ❌ | - |
| DELETE | `/coins/admin/packages/:id` | ❌ | - |
| POST | `/coins/admin/adjust` | ❌ | - |

**Coins: 9/13**

---

## 29. Groups
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/groups` | ✅ | groupService.list |
| GET | `/groups/:slug` | ✅ | groupService.getBySlug |
| POST | `/groups` | ✅ | groupService.create |
| PUT | `/groups/:id` | ✅ | groupService.update |
| DELETE | `/groups/:id` | ✅ | groupService.delete |
| GET | `/groups/me/joined` | ✅ | groupService.getMyJoined |
| GET | `/groups/me/owned` | ✅ | groupService.getMyOwned |
| POST | `/groups/:id/join` | ✅ | groupService.join |
| POST | `/groups/:id/leave` | ✅ | groupService.leave |
| GET | `/groups/:id/members` | ✅ | groupService.listMembers |
| POST | `/groups/:id/members/invite` | ✅ | groupService.inviteMembers |
| PUT | `/groups/:id/members/:userId/role` | ✅ | groupService.updateMemberRole |
| DELETE | `/groups/:id/members/:userId` | ✅ | groupService.removeMember |
| POST | `/groups/:id/members/:userId/ban` | ✅ | groupService.banMember |
| POST | `/groups/:id/members/:userId/unban` | ✅ | groupService.unbanMember |
| GET | `/groups/:id/requests` | ✅ | groupService.listJoinRequests |
| POST | `/groups/:id/requests/:requestId/approve` | ✅ | groupService.approveRequest |
| POST | `/groups/:id/requests/:requestId/reject` | ✅ | groupService.rejectRequest |

**Groups: 18/18**

---

## 30. Conversations & Messages
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/conversations` | ✅ | conversationService.list |
| POST | `/conversations/direct` | ✅ | conversationService.createDirect |
| GET | `/conversations/:id` | ✅ | conversationService.getById |
| POST | `/conversations/:id/read` | ✅ | conversationService.markAsRead |
| POST | `/conversations/:id/mute` | ✅ | conversationService.mute |
| POST | `/conversations/:id/unmute` | ✅ | conversationService.unmute |
| POST | `/conversations/:id/pin` | ✅ | conversationService.pin |
| POST | `/conversations/:id/unpin` | ✅ | conversationService.unpin |
| GET | `/conversations/:id/messages` | ✅ | conversationService.getMessages |
| POST | `/conversations/:id/messages` | ✅ | conversationService.sendMessage |
| PUT | `/conversations/:id/messages/:messageId` | ✅ | conversationService.editMessage |
| DELETE | `/conversations/:id/messages/:messageId` | ✅ | conversationService.deleteMessage |
| POST | `/conversations/:id/messages/:messageId/pin` | ✅ | conversationService.pinMessage |
| POST | `/conversations/:id/messages/:messageId/unpin` | ✅ | conversationService.unpinMessage |
| POST | `/conversations/:id/messages/:messageId/reactions` | ✅ | conversationService.addReaction |
| DELETE | `/conversations/:id/messages/:messageId/reactions/:emoji` | ✅ | conversationService.removeReaction |
| GET | `/messages/search` | ✅ | conversationService.searchMessages |
| GET | `/messages/unread` | ✅ | conversationService.getUnreadCount |

**Conversations & Messages: 18/18**

---

## 31. Contests
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/contests` | ✅ | contestService.list |
| GET | `/contests/:slug` | ✅ | contestService.getBySlug |
| GET | `/contests/me` | ✅ | contestService.getMyContests |
| POST | `/contests` | ✅ | contestService.create |
| PUT | `/contests/:id` | ✅ | contestService.update |
| DELETE | `/contests/:id` | ✅ | contestService.delete |
| POST | `/contests/:id/publish` | ✅ | contestService.publish |
| GET | `/contests/:id/problems` | ✅ | contestService.getProblems |
| POST | `/contests/:id/problems` | ✅ | contestService.createProblem |
| PUT | `/contests/:id/problems/:problemId` | ✅ | contestService.updateProblem |
| DELETE | `/contests/:id/problems/:problemId` | ✅ | contestService.deleteProblem |
| POST | `/contests/:id/join` | ✅ | contestService.join |
| GET | `/contests/:id/leaderboard` | ✅ | contestService.getLeaderboard |
| POST | `/contests/:id/problems/:problemId/submit` | ✅ | contestService.submit |
| GET | `/contests/:id/submissions/me` | ✅ | contestService.getMySubmissions |

**Contests: 15/15**

---

## 32. Personal Events
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/me/events` | ✅ | personalEventService.create |
| GET | `/me/events` | ✅ | personalEventService.list |
| PUT | `/me/events/:id` | ✅ | personalEventService.update |
| DELETE | `/me/events/:id` | ✅ | personalEventService.delete |

**Personal Events: 4/4**

---

## 33. Parent Dashboard
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/parent/children/:id/overview` | ✅ | parentDashboardService.getChildOverview |
| GET | `/parent/children/:id/courses` | ✅ | parentDashboardService.getChildCourses |
| GET | `/parent/children/:id/grades` | ✅ | parentDashboardService.getChildGrades |
| GET | `/parent/children/:id/schedule` | ✅ | parentDashboardService.getChildSchedule |
| GET | `/parent/children/:id/timetable` | ✅ | parentDashboardService.getChildTimetable |
| GET | `/parent/children/:id/attendance` | ✅ | parentDashboardService.getChildAttendance |
| GET | `/parent/children/:id/assignments` | ✅ | parentDashboardService.getChildAssignments |

**Parent Dashboard: 7/7**

---

## 34. Health Check
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/health` | ⚠️ | Backend có, web không cần gọi trực tiếp |

---

# PHẦN B — Web gọi endpoint KHÔNG có trong backend router (🆕/⚠️ rủi ro 404)

> Các module này nằm trong `API_DOCUMENTATION.md` (mô tả trước) và web đã viết service gọi, **NHƯNG chưa có route nào được register trong `backend/internal/router/`** → nếu gọi sẽ bị 404. Cần backend implement (hoặc xác nhận đường dẫn khác).

### B.1 Live Sessions `/live-sessions/*`
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/live-sessions` | 🆕 | liveSessionService.create |
| GET | `/live-sessions` | 🆕 | liveSessionService.list |
| GET | `/live-sessions/:id` | 🆕 | liveSessionService.getById |
| PUT | `/live-sessions/:id` | 🆕 | liveSessionService.update |
| DELETE | `/live-sessions/:id` | 🆕 | liveSessionService.delete |
| POST | `/live-sessions/:id/start` | 🆕 | liveSessionService.start |
| POST | `/live-sessions/:id/end` | 🆕 | liveSessionService.end |
| POST | `/live-sessions/:id/send-reminder` | 🆕 | liveSessionService.sendReminder |
| GET | `/live-sessions/upcoming` | 🆕 | liveSessionService.getUpcoming |
| POST | `/live-sessions/:id/attachments` | 🆕 | liveSessionService.uploadAttachments |

### B.2 LiveKit `/livekit/*`
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/livekit/token` | 🆕 | livekitService.getToken |
| POST | `/livekit/rooms` | 🆕 | livekitService.createRoom |
| GET | `/livekit/rooms/:name` | 🆕 | livekitService.getRoomInfo |

> Ghi chú: Phòng live thực tế nhận `token` + `serverUrl` qua query params (xem `src/app/(live)/rooms/[roomName]/page.tsx`), không nhất thiết qua `/livekit/token`.

### B.3 Schedule Events `/schedule/events/*`
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/schedule/events` | 🆕 | ScheduleService.getAll (BaseService) |
| POST | `/schedule/events` | 🆕 | ScheduleService.create |
| GET | `/schedule/events/:id` | 🆕 | ScheduleService.getById |
| PUT | `/schedule/events/:id` | 🆕 | ScheduleService.update |
| DELETE | `/schedule/events/:id` | 🆕 | ScheduleService.delete |
| PATCH | `/schedule/events/:id/reschedule` | 🆕 | ScheduleService.reschedule |

### B.4 Parent Notifications `/parent-notifications/*`
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| POST | `/parent-notifications/send` | 🆕 | parentNotificationService.send |
| POST | `/parent-notifications/assignment-reminder` | 🆕 | parentNotificationService.sendAssignmentReminder |
| POST | `/parent-notifications/live-session-reminder` | 🆕 | parentNotificationService.sendLiveSessionReminder |
| GET | `/parent-notifications/history` | 🆕 | parentNotificationService.getHistory |
| GET | `/parent-notifications/stats` | 🆕 | parentNotificationService.getStats |

### B.5 Class Schedules `/class-schedules/*`
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/class-schedules` | 🆕 | classScheduleService.getSchedules |
| GET | `/class-schedules/:id` | 🆕 | classScheduleService.getSchedule |
| POST | `/class-schedules` | 🆕 | classScheduleService.createSchedule |
| PUT | `/class-schedules/:id` | 🆕 | classScheduleService.updateSchedule |
| DELETE | `/class-schedules/:id` | 🆕 | classScheduleService.deleteSchedule |
| GET | `/class-schedules/my` | 🆕 | classScheduleService.getMySchedules |
| GET | `/class-schedules/teacher` | 🆕 | classScheduleService.getTeacherSchedules |

> Backend implement dưới path khác: `/classes/:classId/schedules` (sessionService). Web có 2 service trùng chức năng.

### B.6 Teacher Dashboard `/teacher/*`
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/teacher/stats` | 🆕 | useTeacherStats |
| GET | `/teacher/courses` | 🆕 | useTeacherCourses |
| GET | `/teacher/activity` | 🆕 | useTeacherRecentActivity |
| GET | `/teacher/analytics` | 🆕 | useTeacherAnalytics |
| GET | `/teacher/assignments` | 🆕 | useTeacherAssignments |
| GET | `/teacher/exams` | 🆕 | useTeacherExams |

### B.7 Các endpoint web-only khác
| Method | Endpoint | Status | Web Service |
|--------|----------|--------|-------------|
| GET | `/live/rooms/:roomName/token` | 🆕 | livestreamClassroomService.getRoomToken |
| POST | `/auth/select-org` | 🆕 | meet/auth.ts login() |
| GET | `/lessons/:lessonId/quizzes` | 🆕 | quizService.getByLesson |
| GET | `/sessions/:sessionId/quizzes` | 🆕 | quizService.getBySession |
| POST | `/quizzes/:quizId/trigger` | 🆕 | quizService.trigger |
| GET | `/videos/:id` | 🆕 | videoService.getVideo (dùng trong use-course-player) |
| GET | `/videos` | 🆕 | videoService.listVideos |
| GET | `/videos/processing` | 🆕 | videoService.getProcessingQueue |
| GET | `/videos/upload/:uploadId/presigned-url` | 🆕 | videoService.getPresignedUrl (contract cũ) |
| POST | `/videos/upload/:uploadId/chunks/:chunkIndex` | 🆕 | videoService.completeChunk (contract cũ) |
| POST | `/videos/upload/:uploadId/complete` | 🆕 | videoService.completeUpload (contract cũ) |
| GET | `/hls/:videoId/master.m3u8` | 🆕 | videoService.getMasterPlaylist |

> ⚠️ `video.service.ts` dùng contract upload cũ khác với `video-upload.service.ts` (backend chỉ hỗ trợ `/videos/upload/presigned-urls` + `/chunk-complete`). `GET /videos/:id` + `GET /videos` cũng không có trong router — cần kiểm tra có gây lỗi trên Course Player không.

---

# TỔNG KẾT

### Endpoint backend register (Phần A)

| Nhóm | Endpoints | Integrated | Thiếu/⚠️ |
|------|-----------|------------|----------|
| Auth (1.1–1.5) | 28 | 27 | 1 (`/me/org-roles`) |
| Role & Permission | 31 | 31 | 0 |
| Organizations | 7 | 7 | 0 |
| Courses (4.1–4.7) | 55 | 55 | 0 |
| Classes (root) | 17 | 1 | 16 (web dùng scoped theo course) |
| Enrollment & Progress | 7 | 7 | 0 |
| Cart & Orders | 12 | 12 | 0 |
| Vouchers | 14 | 14 | 0 |
| Teachers | 9 | 9 | 0 |
| Upload & Media | 19 | 16 | 3 (`/upload/any`, `/upload` DELETE, `/reprocess`) |
| Livestream | 16 | 16 | 0 |
| Chat & Whiteboard | 8 | 8 | 0 |
| Assignments & Submissions | 20 | 20 | 0 |
| Analytics | 3 | 3 | 0 |
| Gamification | 6 | 6 | 0 |
| Wallet | 5 | 5 | 0 |
| Parent Invitations | 6 | 6 | 0 |
| Discussion Forum | 7 | 7 | 0 |
| Notifications | 8 | 7 | 1 (`/notifications/send`) |
| User Preferences | 2 | 2 | 0 |
| Schedule & Sessions | 22 | 22 | 0 |
| Quizzes | 21 | 13 | 8 (duplicate, stats, question update/reorder/bulk, GET /quizzes, me/quizzes, me/quiz-history) |
| Grades | 17 | 17 | 0 |
| Exercises | 15 | 11 | 4 (list, my-submissions, content-progress x2) |
| Reviews | 6 | 6 | 0 |
| Certificates | 4 | 4 | 0 |
| Reports | 6 | 6 | 0 |
| Coins | 13 | 9 | 4 (admin) |
| Groups | 18 | 18 | 0 |
| Conversations & Messages | 18 | 18 | 0 |
| Contests | 15 | 15 | 0 |
| Personal Events | 4 | 4 | 0 |
| Parent Dashboard | 7 | 7 | 0 |
| Health Check | 1 | 0 | 1 (web không cần) |
| **Tổng Phần A** | **447** | **~409** | **~38** |

### Web-only endpoints (Phần B)

| Nhóm | Số endpoint | Mô tả |
|------|-------------|-------|
| Live Sessions | 10 | Backend chưa register |
| LiveKit | 3 | Backend chưa register |
| Schedule Events | 6 | Backend chưa register |
| Parent Notifications | 5 | Backend chưa register |
| Class Schedules | 7 | Backend có path khác |
| Teacher Dashboard | 6 | Backend chưa register |
| Quiz lesson/session/trigger | 3 | Backend chưa register |
| Live room token | 1 | Backend chưa register |
| Auth select-org | 1 | Backend chưa register |
| Video contract cũ | 7 | Backend không hỗ trợ path này |
| **Tổng Phần B** | **~49** | **Rủi ro 404** |

### Ghi chú quan trọng
1. **4 module trong API_DOCUMENTATION.md không được register trong router** (`/live-sessions`, `/livekit`, `/schedule/events`, `/parent-notifications`) → web gọi sẽ 404 trừ khi backend implement. Cần đối chiếu lại.
2. **Exercises & Contests** là module mới register trong router nhưng **chưa có trong API_DOCUMENTATION.md** — nên bổ sung doc backend.
3. **Coins admin** (`/coins/admin/*`), **quiz duplicate/statistics/bulk**, **notification send** — backend có, web chưa dùng.
4. `classScheduleService` (`/class-schedules/*`) trùng chức năng với `sessionService` (`/classes/:classId/schedules`) — nên thống nhất một contract.
5. `video.service.ts` dùng contract upload/HLS cũ — nên thay bằng `video-upload.service.ts` + `hls.service.ts`.
6. `DELETE /teachers/:id` đang **public (không auth)** trong `teacher_router.go` — cảnh báo bảo mật.
