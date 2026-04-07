# Phase 1: API Checklist

## Overview
- **Priority**: P1
- **Status**: pending
- **Effort**: 2h

Comprehensive list of all backend API endpoints extracted from router files.

---

## API Endpoints by Module

### Auth (`/api/auth`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/auth/register/request` | RequestRegister | - |
| POST | `/auth/register` | Register | - |
| POST | `/auth/login` | Login | - |
| POST | `/auth/reset-password/request` | RequestPasswordReset | - |
| POST | `/auth/reset-password` | ResetPassword | - |
| POST | `/auth/refresh-token` | RefreshToken | - |
| GET | `/auth/profiles` | GetProfiles | Y |
| POST | `/auth/profiles/system` | AddSystemProfile | Y |
| POST | `/auth/switch-profile` | SwitchProfile | Y |
| GET | `/auth/me` | GetMe | Y |
| GET | `/auth/me/profile` | GetMyProfile | Y |
| GET | `/auth/me/system-roles` | GetMySystemRoles | Y |
| PUT | `/auth/me` | UpdateMe | Y |
| GET | `/auth/devices` | GetAllDevices | Y |
| POST | `/auth/logout` | LogoutOneDevice | Y |
| POST | `/auth/logout-all` | LogoutAll | Y |
| PUT | `/auth/change-password` | ChangePassword | Y |

### Courses (`/api/courses`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/courses` | GetAllCourses | - |
| GET | `/courses/:id` | GetCourseByID | - |
| POST | `/courses` | CreateCourse | Y |
| PUT | `/courses/:id` | UpdateCourse | Y |
| DELETE | `/courses/:id` | DeleteCourse | Y |

### Sections (`/api/courses/:courseId/sections`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/courses/:courseId/sections` | CreateSection | Y |
| GET | `/courses/:courseId/sections` | GetAllSections | Y |
| PUT | `/courses/:courseId/sections/reorder` | ReorderSections | Y |
| PUT | `/courses/:courseId/sections/:id` | UpdateSection | Y |
| DELETE | `/courses/:courseId/sections/:id` | DeleteSection | Y |

### Lessons (`/api/courses/:courseId/sections/:sectionId/lessons`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `.../:sectionId/lessons` | CreateLesson | Y |
| GET | `.../:sectionId/lessons` | GetAllLessons | Y |
| PUT | `.../:sectionId/lessons/reorder` | ReorderLessons | Y |
| PUT | `.../:sectionId/lessons/:id` | UpdateLesson | Y |
| DELETE | `.../:sectionId/lessons/:id` | DeleteLesson | Y |

### Lesson Content (`/api/lessons/:lessonId`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/lessons/:lessonId/video` | GetVideo | - |
| GET | `/lessons/:lessonId/article` | GetArticle | - |
| GET | `/lessons/:lessonId/attachments` | GetAttachments | - |
| POST | `/lessons/:lessonId/video` | CreateVideo | Y |
| PUT | `/lessons/:lessonId/video` | UpdateVideo | Y |
| DELETE | `/lessons/:lessonId/video` | DeleteVideo | Y |
| POST | `/lessons/:lessonId/article` | CreateArticle | Y |
| PUT | `/lessons/:lessonId/article` | UpdateArticle | Y |
| DELETE | `/lessons/:lessonId/article` | DeleteArticle | Y |
| POST | `/lessons/:lessonId/attachments` | CreateAttachment | Y |
| DELETE | `/lessons/:lessonId/attachments/:id` | DeleteAttachment | Y |

### Enrollments (`/api/enrollments`, `/api/courses/:courseId/enroll`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/courses/:courseId/enroll` | Enroll | Y |
| DELETE | `/courses/:courseId/enroll` | Unenroll | Y |
| GET | `/enrollments` | GetMyEnrollments | Y |
| GET | `/enrollments/:id` | GetEnrollmentDetail | Y |
| PUT | `/lessons/:lessonId/progress` | UpdateLessonProgress | Y |

### Categories (`/api/categories`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/categories` | GetAllCategories | - |
| GET | `/categories/:id` | GetCategoryByID | - |
| POST | `/categories` | CreateCategory | Y |
| PUT | `/categories/:id` | UpdateCategory | Y |
| DELETE | `/categories/:id` | DeleteCategory | Y |

### Tags (`/api/tags`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/tags` | GetAllTags | - |
| POST | `/tags` | CreateTag | Y |
| DELETE | `/tags/:id` | DeleteTag | Y |

### Cart (`/api/cart`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/cart` | GetCart | Y |
| POST | `/cart` | AddToCart | Y |
| DELETE | `/cart` | RemoveFromCart | Y |
| DELETE | `/cart/clear` | ClearCart | Y |
| GET | `/cart/check/:courseID` | CheckCourseInCart | Y |

### Orders (`/api/orders`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/orders` | CreateOrder | Y |
| GET | `/orders/me` | GetUserOrders | Y |
| GET | `/orders/:id` | GetOrder | Y |
| POST | `/orders/:id/cancel` | CancelOrder | Y |
| POST | `/orders/:id/payment-intent` | CreatePaymentIntent | Y |
| GET | `/orders/:id/payment-status` | GetPaymentStatus | Y |
| POST | `/orders/:id/check-payment` | CheckPayment | Y |

### Vouchers (`/api/vouchers`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/vouchers/public` | GetPublicVouchers | - |
| GET | `/vouchers/code/:code` | GetVoucherByCode | - |
| GET | `/vouchers/me` | GetUserSavedVouchers | Y |
| POST | `/vouchers/:id/save` | SaveVoucher | Y |
| DELETE | `/vouchers/:id/save` | UnsaveVoucher | Y |
| POST | `/vouchers` | CreateVoucher | Y |
| GET | `/vouchers` | GetAllVouchers | Y |
| GET | `/vouchers/:id` | GetVoucher | Y |
| PUT | `/vouchers/:id` | UpdateVoucher | Y |
| DELETE | `/vouchers/:id` | DeleteVoucher | Y |
| POST | `/vouchers/:id/restore` | RestoreVoucher | Y |
| POST | `/vouchers/:id/activate` | ActivateVoucher | Y |
| POST | `/vouchers/:id/deactivate` | DeactivateVoucher | Y |
| GET | `/vouchers/:id/stats` | GetVoucherStats | Y |

### Classes (`/api/classes`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/classes` | CreateClass | - |
| GET | `/classes` | GetAllClasses | - |
| GET | `/classes/:id` | GetClassByID | - |
| PUT | `/classes/:id` | UpdateClass | - |
| DELETE | `/classes/:id` | DeleteClass | - |
| POST | `/classes/:id/teachers` | AssignTeacherToClass | - |
| DELETE | `/classes/:id/teachers/:teacherId` | RemoveTeacherFromClass | - |
| GET | `/classes/:id/teachers` | GetTeachersByClass | - |
| POST | `/classes/:id/students` | EnrollStudentToClass | - |
| DELETE | `/classes/:id/students/:studentId` | RemoveStudentFromClass | - |
| GET | `/classes/:id/students` | GetStudentsByClass | - |

### Class Schedules (`/api/classes/:classId/schedules`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/classes/:classId/schedules` | CreateClassSchedule | - |
| GET | `/classes/:classId/schedules` | GetAllClassSchedules | - |
| PUT | `/classes/:classId/schedules/:id` | UpdateClassSchedule | - |
| DELETE | `/classes/:classId/schedules/:id` | DeleteClassSchedule | - |

### Attendance (`/api/classes/:classId/attendances`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/classes/:classId/attendances` | MarkAttendance | - |
| GET | `/classes/:classId/attendances` | GetAllAttendances | - |
| GET | `/classes/:classId/attendances/:id` | GetAttendanceByID | - |
| PUT | `/classes/:classId/attendances/:id` | UpdateAttendance | - |
| DELETE | `/classes/:classId/attendances/:id` | DeleteAttendance | - |

### Teachers (`/api/teachers`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/teachers` | GetAllTeachers | - |
| GET | `/teachers/:id` | GetTeacher | - |
| DELETE | `/teachers/:id` | DeleteTeacher | - |

### Teacher Profiles (`/api/teacher-profiles`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/teacher-profiles` | CreateTeacherProfile | - |
| GET | `/teacher-profiles` | GetAllTeacherProfiles | - |
| GET | `/teacher-profiles/:id` | GetTeacherProfileByID | - |
| PUT | `/teacher-profiles/:id` | UpdateTeacherProfile | - |
| DELETE | `/teacher-profiles/:id` | DeleteTeacherProfile | - |

### Organizations (`/api/organizations`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/organizations` | CreateOrganization | - |
| GET | `/organizations` | GetAllOrganizations | - |
| GET | `/organizations/:id` | GetOrganization | - |
| PUT | `/organizations/:id` | UpdateOrganization | - |
| DELETE | `/organizations/:id` | DeleteOrganization | - |

### Profile/Me (`/api/me`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/me/children` | GetChildren | Y |
| GET | `/me/organizations` | GetOrganizations | Y |
| GET | `/me/org-roles` | GetMyOrgRoles | Y |
| GET | `/me/system-roles` | GetMySystemRoles | Y |

### Org Roles (`/api/org-roles`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/org-roles` | CreateRole | Y |
| GET | `/org-roles` | GetAllRoles | Y |
| GET | `/org-roles/:id` | GetRole | Y |
| PUT | `/org-roles/:id` | UpdateRole | Y |
| DELETE | `/org-roles/:id` | DeleteRole | Y |
| PATCH | `/org-roles/:id/restore` | RestoreRole | Y |
| GET | `/org-roles/:id/permissions` | GetRolePermissions | Y |
| POST | `/org-roles/:id/permissions` | AddPermissionsToRole | Y |
| PUT | `/org-roles/:id/permissions` | SetRolePermissions | Y |
| DELETE | `/org-roles/:id/permissions` | RemovePermissionsFromRole | Y |
| GET | `/org-roles/:role_id/users` | GetUsersWithOrgRoleSimple | Y |

### System Roles (`/api/system-roles`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/system-roles` | GetAllSystemRoles | - |
| POST | `/system-roles` | CreateSystemRole | Y |
| GET | `/system-roles/:id` | GetSystemRole | Y |
| PUT | `/system-roles/:id` | UpdateSystemRole | Y |
| DELETE | `/system-roles/:id` | DeleteSystemRole | Y |
| PATCH | `/system-roles/:id/restore` | RestoreSystemRole | Y |
| GET | `/system-roles/:id/permissions` | GetSystemRolePermissions | Y |
| POST | `/system-roles/:id/permissions` | AddPermissionsToSystemRole | Y |
| PUT | `/system-roles/:id/permissions` | SetSystemRolePermissions | Y |
| DELETE | `/system-roles/:id/permissions` | RemovePermissionsFromSystemRole | Y |
| GET | `/system-roles/:system_role_id/users` | GetUsersBySystemRole | Y |

### User System Roles (`/api/users/:user_id/system-roles`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/users/:user_id/system-roles` | GetUserSystemRoles | Y |
| POST | `/users/:user_id/system-roles` | AssignSystemRolesToUser | Y |
| DELETE | `/users/:user_id/system-roles/:system_role_id` | RevokeSystemRoleFromUser | Y |

### User Org Roles (`/api/users/:user_id/org-roles`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/users/:user_id/org-roles` | GetUserOrgRoles | Y |
| POST | `/users/:user_id/org-roles` | AssignOrgRolesToUser | Y |
| DELETE | `/users/:user_id/org-roles/:org_role_id` | RevokeOrgRoleFromUser | Y |

### Organization Members (`/api/organizations/:organization_id`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/organizations/:organization_id/members` | GetOrganizationMembers | Y |
| GET | `/organizations/:organization_id/roles/:role_id/users` | GetUsersWithOrgRole | Y |

### Permissions (`/api/permissions`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/permissions` | GetAllPermissions | Y |
| GET | `/permissions/:id` | GetPermissionByID | Y |
| PUT | `/permissions/:id` | UpdatePermission | Y |

### Upload (`/api/upload`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/upload` | UploadImage | Y |
| POST | `/upload/any` | Upload | Y |
| DELETE | `/upload` | DeleteFile | Y |

### Video Upload (`/api/videos`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/videos/health` | Health | - |
| POST | `/videos/upload/init` | InitVideoUpload | Y |
| POST | `/videos/upload/presigned-urls` | GetPresignedURLs | Y |
| POST | `/videos/upload/chunk-complete` | CompleteChunkUpload | Y |
| POST | `/videos/upload/complete` | CompleteVideoUpload | Y |
| GET | `/videos/upload/:upload_id/status` | GetUploadStatus | Y |
| GET | `/videos/upload/:upload_id/resume` | GetResumeInfo | Y |
| GET | `/videos/upload/incomplete` | GetIncompleteUploads | Y |
| DELETE | `/videos/upload/:upload_id` | AbortUpload | Y |
| GET | `/videos/processing/queue` | GetProcessingQueue | Y |

### HLS Streaming (`/api/hls`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/hls/:upload_id/info` | GetVideoInfo | - |
| GET | `/hls/:upload_id/master.m3u8` | GetMasterPlaylist | - |
| GET | `/hls/:upload_id/:quality/index.m3u8` | GetPlaylist | - |
| GET | `/hls/:upload_id/:quality/:segment` | GetSegment | - |

### Livestream (`/api/livestream`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/livestream` | Create | Y |
| GET | `/livestream` | GetAll | Y |
| GET | `/livestream/:id` | GetByID | Y |
| PUT | `/livestream/:id` | Update | Y |
| DELETE | `/livestream/:id` | Delete | Y |
| POST | `/livestream/:id/start` | Start | Y |
| POST | `/livestream/:id/end` | End | Y |
| POST | `/livestream/:id/join` | Join | Y |
| POST | `/livestream/:id/leave` | Leave | Y |
| GET | `/livestream/:id/participants` | GetParticipants | Y |
| POST | `/livestream/:id/mute` | MuteParticipant | Y |
| POST | `/livestream/:id/kick` | KickParticipant | Y |
| POST | `/livestream/:id/lock-whiteboard` | LockWhiteboard | Y |
| POST | `/livestream/:id/unlock-whiteboard` | UnlockWhiteboard | Y |
| POST | `/livestream/:id/screenshare/start` | StartScreenShare | Y |
| POST | `/livestream/:id/screenshare/stop` | StopScreenShare | Y |

### Chat (`/api/chat`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/chat/send` | Send | Y |
| GET | `/chat/:sessionId/messages` | GetMessages | Y |
| DELETE | `/chat/:id` | DeleteMessage | Y |
| POST | `/chat/:id/pin` | PinMessage | Y |
| POST | `/chat/:id/unpin` | UnPinMessage | Y |

### Whiteboard (`/api/whiteboard`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/whiteboard/:sessionId/snapshot` | GetSnapshot | Y |
| POST | `/whiteboard/:sessionId/snapshot` | SaveSnapshot | Y |
| POST | `/whiteboard/:sessionId/event` | BroadcastEvent | Y |

### Analytics (`/api/analytics`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/analytics/livestream/:sessionId` | GetLivestreamAnalytics | Y |
| GET | `/analytics/assignment/:assignmentId` | GetAssignmentAnalytics | Y |
| GET | `/analytics/participants/:sessionId` | GetParticipantAnalytics | Y |

### Assignments (`/api/assignments`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/assignments` | Create | Y |
| GET | `/assignments` | GetBySession | Y |
| GET | `/assignments/:id` | GetByID | Y |
| GET | `/assignments/:id/sandbox` | GetSandbox | Y |
| PUT | `/assignments/:id` | Update | Y |
| DELETE | `/assignments/:id` | Delete | Y |
| POST | `/assignments/:id/publish` | Publish | Y |
| POST | `/assignments/:id/unpublish` | Unpublish | Y |
| GET | `/assignments/:id/testcases` | GetTestCases | Y |
| POST | `/assignments/:id/testcases` | AddTestCase | Y |
| POST | `/assignments/:id/testcases/import` | ImportTestCases | Y |
| DELETE | `/assignments/:id/testcases/:tcId` | DeleteTestCase | Y |

### Submissions (`/api/submissions`)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/submissions` | Submit | Y |
| POST | `/submissions/run` | RunCode | Y |
| POST | `/submissions/run-custom` | RunCustomCode | Y |
| POST | `/submissions/execute` | ExecuteCode | Y |
| GET | `/submissions/:id` | GetByID | Y |
| GET | `/submissions/assignment/:assignmentId` | GetByAssignment | Y |
| GET | `/submissions/my/:assignmentId` | GetMySubmissions | Y |
| GET | `/submissions/user/:userId` | GetByUser | Y |

---

## Summary Statistics
- **Total Modules**: 25
- **Total Endpoints**: ~150
- **Public Endpoints**: ~30
- **Protected Endpoints**: ~120
