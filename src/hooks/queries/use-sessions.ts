import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  sessionService,
  CreateClassScheduleDTO,
  UpdateClassScheduleDTO,
  CreateClassSessionDTO,
  UpdateClassSessionDTO,
  GenerateSessionsDTO,
  MarkAttendanceDTO,
  BulkAttendanceDTO,
  UpdateAttendanceDTO,
  ReminderSetting,
} from "@/services/session.service";

// ─── Query keys ────────────────────────────────────────────────────────────

export const sessionKeys = {
  all: ["sessions"] as const,
  schedules: (classId: string) => [...sessionKeys.all, "schedules", classId] as const,
  sessions: (classId: string) => [...sessionKeys.all, "sessions", classId] as const,
  session: (classId: string, sessionId: string) =>
    [...sessionKeys.all, "session", classId, sessionId] as const,
  attendances: (sessionId: string) => [...sessionKeys.all, "attendances", sessionId] as const,
  timetable: (classId: string) => [...sessionKeys.all, "timetable", classId] as const,
  myTimetable: () => [...sessionKeys.all, "my-timetable"] as const,
  myAttendances: () => [...sessionKeys.all, "my-attendances"] as const,
  reminders: () => [...sessionKeys.all, "reminders"] as const,
};

// ─── Class Schedules ───────────────────────────────────────────────────────

export function useClassSchedules(classId: string) {
  return useQuery({
    queryKey: sessionKeys.schedules(classId),
    queryFn: () => sessionService.getSchedules(classId),
    enabled: !!classId,
  });
}

export function useCreateSchedule(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClassScheduleDTO) => sessionService.createSchedule(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.schedules(classId) });
      toast.success("Đã tạo lịch học");
    },
    onError: () => toast.error("Không thể tạo lịch học"),
  });
}

export function useUpdateSchedule(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, data }: { scheduleId: string; data: UpdateClassScheduleDTO }) =>
      sessionService.updateSchedule(classId, scheduleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.schedules(classId) });
      toast.success("Đã cập nhật lịch học");
    },
    onError: () => toast.error("Không thể cập nhật lịch học"),
  });
}

export function useDeleteSchedule(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scheduleId: string) => sessionService.deleteSchedule(classId, scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.schedules(classId) });
      toast.success("Đã xóa lịch học");
    },
    onError: () => toast.error("Không thể xóa lịch học"),
  });
}

export function useClassTimetable(classId: string) {
  return useQuery({
    queryKey: sessionKeys.timetable(classId),
    queryFn: () => sessionService.getClassTimetable(classId),
    enabled: !!classId,
  });
}

// ─── Class Sessions ────────────────────────────────────────────────────────

export function useClassSessions(classId: string, params?: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: [...sessionKeys.sessions(classId), params],
    queryFn: () => sessionService.getSessions(classId, params),
    enabled: !!classId,
  });
}

export function useClassSession(classId: string, sessionId: string) {
  return useQuery({
    queryKey: sessionKeys.session(classId, sessionId),
    queryFn: () => sessionService.getSession(classId, sessionId),
    enabled: !!classId && !!sessionId,
  });
}

export function useCreateSession(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClassSessionDTO) => sessionService.createSession(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.sessions(classId) });
      toast.success("Đã tạo buổi học");
    },
    onError: () => toast.error("Không thể tạo buổi học"),
  });
}

export function useGenerateSessions(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateSessionsDTO) => sessionService.generateSessions(classId, data),
    onSuccess: (sessions) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.sessions(classId) });
      toast.success(`Đã tạo ${sessions.length} buổi học`);
    },
    onError: () => toast.error("Không thể tạo buổi học"),
  });
}

export function useUpdateSession(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: UpdateClassSessionDTO }) =>
      sessionService.updateSession(classId, sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.sessions(classId) });
      toast.success("Đã cập nhật buổi học");
    },
    onError: () => toast.error("Không thể cập nhật buổi học"),
  });
}

export function useCancelSession(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: string; reason?: string }) =>
      sessionService.cancelSession(classId, sessionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.sessions(classId) });
      toast.success("Đã hủy buổi học");
    },
    onError: () => toast.error("Không thể hủy buổi học"),
  });
}

// ─── Session Attendance ────────────────────────────────────────────────────

export function useSessionAttendances(sessionId: string) {
  return useQuery({
    queryKey: sessionKeys.attendances(sessionId),
    queryFn: () => sessionService.getAttendances(sessionId),
    enabled: !!sessionId,
  });
}

export function useMarkAttendance(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MarkAttendanceDTO) => sessionService.markAttendance(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.attendances(sessionId) });
      toast.success("Đã điểm danh");
    },
    onError: () => toast.error("Không thể điểm danh"),
  });
}

export function useBulkMarkAttendance(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkAttendanceDTO) => sessionService.bulkMarkAttendance(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.attendances(sessionId) });
      toast.success("Đã điểm danh hàng loạt");
    },
    onError: () => toast.error("Không thể điểm danh"),
  });
}

export function useUpdateAttendance(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ attendanceId, data }: { attendanceId: string; data: UpdateAttendanceDTO }) =>
      sessionService.updateAttendance(sessionId, attendanceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.attendances(sessionId) });
      toast.success("Đã cập nhật điểm danh");
    },
    onError: () => toast.error("Không thể cập nhật điểm danh"),
  });
}

export function useCheckIn(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sessionService.checkIn(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.attendances(sessionId) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.myAttendances() });
      toast.success("Đã check-in thành công");
    },
    onError: () => toast.error("Không thể check-in"),
  });
}

export function useCheckOut(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sessionService.checkOut(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.attendances(sessionId) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.myAttendances() });
      toast.success("Đã check-out thành công");
    },
    onError: () => toast.error("Không thể check-out"),
  });
}

// ─── My Timetable & Attendance ─────────────────────────────────────────────

export function useMyTimetable(weekOffset?: number) {
  return useQuery({
    queryKey: [...sessionKeys.myTimetable(), weekOffset],
    queryFn: () => sessionService.getMyTimetable({ week_offset: weekOffset }),
  });
}

export function useMyAttendances(params?: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: [...sessionKeys.myAttendances(), params],
    queryFn: () => sessionService.getMyAttendances(params),
  });
}

// ─── Reminder Settings ─────────────────────────────────────────────────────

export function useReminderSettings() {
  return useQuery({
    queryKey: sessionKeys.reminders(),
    queryFn: () => sessionService.getReminderSettings(),
  });
}

export function useUpdateReminderSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReminderSetting) => sessionService.updateReminderSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.reminders() });
      toast.success("Đã cập nhật cài đặt nhắc nhở");
    },
    onError: () => toast.error("Không thể cập nhật cài đặt"),
  });
}
