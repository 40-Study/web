// ─── Auth ───────────────────────────────────────────────────────────────────
export {
  authService,
  getDeviceId,
  getDeviceInfo,
  startOAuthFlow,
  type RegisterRequestDTO,
  type RegisterDTO,
  type DeviceInfo,
  type LoginDTO,
  type UserResponseDto,
  type DeviceSessionDto,
  type EntryContext,
  type UnifiedRole,
  type LoginResponseData,
  type LoginResponse,
  type SelectRoleDTO,
  type SwitchRoleDTO,
  type SelectRoleResponseData,
  type SelectRoleResponse,
  type SystemRoleOption,
  type UpdateProfileDTO,
  type PublicProfileResponse,
  type TokenResponse,
  type Device,
  type DevicesResponse,
  type ResetPasswordRequestDTO,
  type ResetPasswordDTO,
  type ChangePasswordDTO,
  type Organization as AuthOrganization,
  type Child,
  type LinkedAccount,
  type MyOrgRolesResponse,
} from "./auth.service";

// ─── Course & Content ───────────────────────────────────────────────────────
export { courseService } from "./course.service";
export type { ApiCourse, ApiInstructor, ApiCategory, CourseListParams, CreateCourseDTO, UpdateCourseDTO } from "./course.service";
export { sectionService } from "./section.service";
export type { Section, CreateSectionDTO, UpdateSectionDTO } from "./section.service";
export { lessonService } from "./lesson.service";
export type { Lesson, CreateLessonDTO, UpdateLessonDTO } from "./lesson.service";
export { lessonContentService } from "./lesson-content.service";
export type { LessonContent, CreateContentDTO, ContentType } from "./lesson-content.service";

// ─── Class ──────────────────────────────────────────────────────────────────
export { classService } from "./class.service";
export type { Class, CreateClassDTO, UpdateClassDTO, Attendance } from "./class.service";

// ─── Quiz & Exercise ────────────────────────────────────────────────────────
export { quizService } from "./quiz.service";
export type { Quiz, QuizQuestion, QuizAttempt, CreateQuizDTO, StartQuizResponse, SubmitQuizDTO, QuizAttemptDetail, AttemptQuestion, AttemptAnswer } from "./quiz.service";
export { exerciseService } from "./exercise.service";
export type { Exercise, TestCase, CreateExerciseDTO, ExerciseSubmission, ExerciseSubmissionDTO } from "./exercise.service";

// ─── Assignment & Submission ────────────────────────────────────────────────
export { assignmentService } from "./assignment.service";
export type {
  DifficultyLevel,
  ProgrammingLanguage,
  AssignmentResponseDTO,
  AssignmentListDTO,
  SandboxResponseDTO,
  TestCaseResponseDTO,
  CreateAssignmentDTO,
  UpdateAssignmentDTO,
} from "./assignment.service";
export { submissionService } from "./submission.service";
export type { SubmissionResponseDTO, SubmitCodeDTO, RunCodeDTO, RunResultDTO } from "./submission.service";

// ─── Category & Tag ─────────────────────────────────────────────────────────
export { categoryService } from "./category.service";
export type { Category, Tag, CreateCategoryDTO } from "./category.service";

// ─── Voucher ────────────────────────────────────────────────────────────────
export { voucherService } from "./voucher.service";
export type { Voucher, CreateVoucherDTO } from "./voucher.service";

// ─── Cart & Order ───────────────────────────────────────────────────────────
export { cartService } from "./cart.service";
export type { Cart, CartItem } from "./cart.service";
export { orderService } from "./order.service";
export type { Order, OrderItem, CreateOrderDTO } from "./order.service";

// ─── Enrollment ─────────────────────────────────────────────────────────────
export { enrollmentService } from "./enrollment.service";
export type { Enrollment } from "./enrollment.service";

// ─── Livestream & Media ─────────────────────────────────────────────────────
export { livestreamService } from "./livestream.service";
export type { LivestreamSession, CreateLivestreamDTO } from "./livestream.service";
export { chatService } from "./chat.service";
export type { ChatMessage, SendMessageDTO } from "./chat.service";
export { whiteboardService } from "./whiteboard.service";
export type { WhiteboardSnapshot } from "./whiteboard.service";
export { videoUploadService } from "./video-upload.service";
export type { InitUploadDTO, UploadStatus } from "./video-upload.service";
export { hlsService } from "./hls.service";

// ─── Organization & Roles ───────────────────────────────────────────────────
export { organizationService } from "./organization.service";
export type { Organization, OrgMember, CreateOrgDTO } from "./organization.service";
export { roleService } from "./role.service";
export type { OrgRole, SystemRole } from "./role.service";
export { permissionService } from "./permission.service";
export type { Permission } from "./permission.service";

// ─── Teacher ────────────────────────────────────────────────────────────────
export { teacherService } from "./teacher.service";
export type { Teacher, TeacherProfile, CreateTeacherProfileDTO } from "./teacher.service";

// ─── Analytics ──────────────────────────────────────────────────────────────
export { analyticsService } from "./analytics.service";
export type { AnalyticsResponseDTO, AssignmentAnalyticsDTO, ParticipantAnalyticsDTO } from "./analytics.service";

// ─── Other services (keep existing if still used) ───────────────────────────
export * from "./achievement.service";
export * from "./leaderboard.service";
export * from "./discussion.service";
export * from "./wallet.service";
export * from "./notification.service";
export * from "./user-stats.service";
export * from "./user-preference.service";
export * from "./video.service";
export * from "./schedule.service";
export * from "./invitation.service";
export * from "./livekit.service";
export * from "./livestream-classroom.service";
export * from "./class-schedule.service";
