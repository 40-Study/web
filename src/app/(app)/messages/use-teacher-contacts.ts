"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useEnrolledCourses } from "@/hooks/use-courses";
import { useChildren } from "@/hooks/queries/use-auth";
import { parentDashboardKeys } from "@/hooks/queries/use-parent-dashboard";
import { parentDashboardService } from "@/services/parent-dashboard.service";
import {
  contactsFromChildren,
  contactsFromEnrolled,
  type TeacherContactsResult,
} from "./teacher-contacts";

export interface TeacherContactsQuery {
  result: TeacherContactsResult;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/** Học sinh: giảng viên của các khoá đang học. Chỉ mount trong thân dialog của học sinh. */
export function useStudentTeacherContacts(): TeacherContactsQuery {
  const q = useEnrolledCourses();
  const result = useMemo(() => contactsFromEnrolled(q.data ?? []), [q.data]);
  return { result, isLoading: q.isLoading, isError: q.isError, refetch: () => void q.refetch() };
}

/**
 * Phụ huynh: giảng viên các khoá của TỪNG con đã liên kết (E2). Query key trùng
 * `useChildCourses(childId, 1, 50)` để dùng chung cache với trang chi tiết con.
 * Chỉ mount trong thân dialog của phụ huynh.
 */
export function useParentTeacherContacts(): TeacherContactsQuery {
  const childrenQ = useChildren();
  const children = useMemo(() => childrenQ.data?.children ?? [], [childrenQ.data?.children]);
  const courseQs = useQueries({
    queries: children.map((child) => ({
      queryKey: [...parentDashboardKeys.courses(child.id), 1, 50],
      queryFn: () => parentDashboardService.getChildCourses(child.id, 1, 50),
    })),
  });

  // useQueries trả mảng mới mỗi lần render; dataUpdatedAt chỉ đổi khi dữ liệu thật sự đổi.
  const coursesKey = courseQs.map((q) => q.dataUpdatedAt).join(",");
  const result = useMemo(
    () =>
      contactsFromChildren(
        children.map((child, i) => ({
          childName: child.full_name || child.username,
          courses: courseQs[i]?.data?.courses ?? [],
        }))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [children, coursesKey]
  );

  return {
    result,
    isLoading: childrenQ.isLoading || courseQs.some((q) => q.isLoading),
    isError: childrenQ.isError || courseQs.some((q) => q.isError),
    refetch: () => {
      void childrenQ.refetch();
      courseQs.forEach((q) => void q.refetch());
    },
  };
}
