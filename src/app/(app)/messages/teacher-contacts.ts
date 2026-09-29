/**
 * Danh bạ giảng viên cho hộp "Tin nhắn mới" (QA vòng 2 E1/E2) — hàm thuần để test được.
 *
 * Tách 2 trạng thái rỗng mà trước đây bị gộp làm một (N12): "chưa có khoá nào" khác hẳn "có khoá
 * nhưng thiếu dữ liệu giảng viên". Gộp lại thì học viên đang học 3 khoá vẫn bị báo "Bạn chưa đăng
 * ký khoá học nào", tức là giao diện nói sai sự thật về dữ liệu của họ.
 */

export interface TeacherContact {
  id: string;
  name: string;
  avatar?: string;
  /** Tên khoá (kèm tên con với phụ huynh) để người dùng biết đang nhắn giảng viên nào. */
  contexts: string[];
}

export interface TeacherContactsResult {
  contacts: TeacherContact[];
  /** Tổng số khoá đã xét — 0 nghĩa là thật sự chưa có khoá nào. */
  totalCourses: number;
}

export type TeacherContactsState = "ready" | "no-courses" | "missing-instructor";

export function contactsState(result: TeacherContactsResult): TeacherContactsState {
  if (result.contacts.length > 0) return "ready";
  return result.totalCourses === 0 ? "no-courses" : "missing-instructor";
}

interface Entry {
  /** Kiểu `ID` của web có thể là number; "" / 0 / null đều là "không có giảng viên". */
  id?: string | number | null;
  name?: string | null;
  avatar?: string | null;
  context: string;
}

function collect(entries: Entry[]): TeacherContact[] {
  const map = new Map<string, TeacherContact>();
  for (const e of entries) {
    if (!e.id) continue;
    const id = String(e.id);
    const existing = map.get(id);
    if (existing) {
      if (!existing.contexts.includes(e.context)) existing.contexts.push(e.context);
      continue;
    }
    map.set(id, {
      id,
      name: e.name?.trim() || "Giảng viên",
      avatar: e.avatar ?? undefined,
      contexts: [e.context],
    });
  }
  return Array.from(map.values());
}

/** Học sinh: từ danh sách khoá đã ghi danh (useEnrolledCourses). */
export function contactsFromEnrolled(
  courses: { title: string; instructor?: { id?: string | number | null; name?: string | null; avatar?: string | null } }[]
): TeacherContactsResult {
  return {
    totalCourses: courses.length,
    contacts: collect(
      courses.map((c) => ({
        id: c.instructor?.id,
        name: c.instructor?.name,
        avatar: c.instructor?.avatar,
        context: c.title,
      }))
    ),
  };
}

/** Phụ huynh: từ khoá của từng con (`/parent/children/:id/courses`). */
export function contactsFromChildren(
  children: {
    childName: string;
    courses: { course_name: string; instructor_id?: string; instructor_name: string }[];
  }[]
): TeacherContactsResult {
  const entries: Entry[] = [];
  let total = 0;
  for (const child of children) {
    for (const c of child.courses) {
      total++;
      entries.push({
        id: c.instructor_id,
        name: c.instructor_name,
        context: `${c.course_name} (con: ${child.childName})`,
      });
    }
  }
  return { totalCourses: total, contacts: collect(entries) };
}
