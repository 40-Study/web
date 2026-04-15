import { useQuery } from "@tanstack/react-query";
import { parentDashboardService } from "@/services/parent-dashboard.service";

export const parentDashboardKeys = {
  all: ["parent-dashboard"] as const,
  overview: (childId: string) => [...parentDashboardKeys.all, "overview", childId] as const,
  courses: (childId: string) => [...parentDashboardKeys.all, "courses", childId] as const,
  grades: (childId: string) => [...parentDashboardKeys.all, "grades", childId] as const,
  schedule: (childId: string) => [...parentDashboardKeys.all, "schedule", childId] as const,
  timetable: (childId: string) => [...parentDashboardKeys.all, "timetable", childId] as const,
  attendance: (childId: string) => [...parentDashboardKeys.all, "attendance", childId] as const,
  assignments: (childId: string) => [...parentDashboardKeys.all, "assignments", childId] as const,
};

export function useChildOverview(childId: string) {
  return useQuery({
    queryKey: parentDashboardKeys.overview(childId),
    queryFn: () => parentDashboardService.getChildOverview(childId),
    enabled: !!childId,
  });
}

export function useChildCourses(childId: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...parentDashboardKeys.courses(childId), page, pageSize],
    queryFn: () => parentDashboardService.getChildCourses(childId, page, pageSize),
    enabled: !!childId,
  });
}

export function useChildGrades(childId: string) {
  return useQuery({
    queryKey: parentDashboardKeys.grades(childId),
    queryFn: () => parentDashboardService.getChildGrades(childId),
    enabled: !!childId,
  });
}

export function useChildSchedule(childId: string) {
  return useQuery({
    queryKey: parentDashboardKeys.schedule(childId),
    queryFn: () => parentDashboardService.getChildSchedule(childId),
    enabled: !!childId,
  });
}

export function useChildTimetable(childId: string) {
  return useQuery({
    queryKey: parentDashboardKeys.timetable(childId),
    queryFn: () => parentDashboardService.getChildTimetable(childId),
    enabled: !!childId,
  });
}

export function useChildAttendance(childId: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...parentDashboardKeys.attendance(childId), page, pageSize],
    queryFn: () => parentDashboardService.getChildAttendance(childId, page, pageSize),
    enabled: !!childId,
  });
}

export function useChildAssignments(childId: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...parentDashboardKeys.assignments(childId), page, pageSize],
    queryFn: () => parentDashboardService.getChildAssignments(childId, page, pageSize),
    enabled: !!childId,
  });
}
