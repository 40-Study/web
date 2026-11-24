import { useQueries, useQuery } from "@tanstack/react-query";
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

/**
 * Q5-PG-01: tab Điểm danh cần "Xem thêm". Mỗi trang dùng CÙNG khoá với `useChildAttendance(childId, p, size)`,
 * nên trang 1 dùng chung cache với tab Tổng quan và không bắn thêm request. `stats`/`total` lấy từ trang 1
 * (backend tính trên toàn bộ bản ghi của con, không phải trang).
 */
export function useChildAttendancePages(childId: string, pageCount: number, pageSize = 20) {
  const results = useQueries({
    queries: Array.from({ length: pageCount }, (_, i) => ({
      queryKey: [...parentDashboardKeys.attendance(childId), i + 1, pageSize],
      queryFn: () => parentDashboardService.getChildAttendance(childId, i + 1, pageSize),
      enabled: !!childId,
    })),
  });
  const first = results[0]?.data;
  // Phân trang theo offset trên danh sách mới nhất trước: bản ghi mới thêm giữa hai lần "Xem thêm" đẩy một dòng
  // sang trang kế và lặp lại (key React trùng). Lọc theo id (review L2).
  const seen = new Set<string>();
  const records = results
    .flatMap((r) => r.data?.records ?? [])
    .filter((rec) => !seen.has(rec.id) && seen.add(rec.id));
  return {
    stats: first?.stats,
    total: first?.total ?? 0,
    records,
    /** Tải lại các trang bị lỗi (nút "Thử lại"). */
    retry: () => {
      results.filter((r) => r.isError).forEach((r) => void r.refetch());
    },
    isLoading: results[0]?.isLoading ?? false,
    isFetchingMore: results.slice(1).some((r) => r.isFetching),
    isError: results.some((r) => r.isError),
  };
}

export function useChildAssignments(childId: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...parentDashboardKeys.assignments(childId), page, pageSize],
    queryFn: () => parentDashboardService.getChildAssignments(childId, page, pageSize),
    enabled: !!childId,
  });
}
