import { ApiError } from "@/lib/errors";
import { assignmentService } from "@/services/assignment.service";
import { livestreamClassroomService, type Assignment } from "@/services/livestream-classroom.service";

const PAGE_SIZE = 100;
/** Chặn vòng lặp khi backend trả `total` sai: 100 trang x 100 bài là quá đủ cho một học viên. */
const MAX_PAGES = 100;

/**
 * Danh sách "Bài tập của tôi" (QA7 S7-09, C16): MỘT request `GET /me/assignments` (theo trang, không theo số buổi học).
 *
 * Fallback có chủ đích và chỉ cho đúng một tình huống: backend cũ chưa có route (404) -> cách cũ, mỗi buổi livestream
 * một `GET /assignments?session_id=`. Mọi lỗi khác (401, 5xx, mạng) được ném lên để trang hiện lỗi, không nuốt.
 */
export async function fetchMyAssignments(): Promise<Assignment[]> {
  try {
    return await walkMyAssignments();
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
    return fetchBySessionFanOut();
  }
}

async function walkMyAssignments(): Promise<Assignment[]> {
  const all: Assignment[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await assignmentService.getMine(page, PAGE_SIZE);
    const items = res.data ?? [];
    all.push(...items);
    if (items.length < PAGE_SIZE || all.length >= (res.total ?? 0)) return all;
  }
  throw new Error(`Danh sách bài tập vượt quá ${MAX_PAGES} trang`);
}

async function fetchBySessionFanOut(): Promise<Assignment[]> {
  const sessions = await livestreamClassroomService.listSessions();
  if (!sessions || sessions.length === 0) return [];

  const results = await Promise.allSettled(sessions.map((s) => livestreamClassroomService.getAssignments(s.id)));
  const all: Assignment[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && Array.isArray(result.value)) all.push(...result.value);
  }
  return all;
}
