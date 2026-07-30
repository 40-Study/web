# Phase 03 — Attendance UI (giáo viên + học sinh)

**Ưu tiên:** P0 — giá trị cao nhất | **Trạng thái:** chưa bắt đầu | **Phụ thuộc:** phase 02

## ⛔ Chốt endpoint trước khi viết dòng code nào

Backend có **hai** hệ điểm danh song song. Dùng sai hệ là build lên code chết.

| | ❌ DEPRECATED | ✅ CANONICAL |
|---|---|---|
| Bảng | `attendances` | `session_attendances` |
| Model | `model.Attendance` | `model.SessionAttendance` |
| Handler | `AttendanceHandler` | `ScheduleHandler` |
| Route | `/classes/:classId/attendances` | `/sessions/:sessionId/attendances` |
| Khóa | `(class_id, student_id, date)` | `(session_id, student_id)` |

Bằng chứng deprecated: `internal/model/schedule.go:89` — comment `"Diem danh chi tiet theo buoi hoc (thay the Attendance cu)"`. Route cũ còn bị đăng ký **trùng lặp** ở cả `class_router.go:38` và `course_router.go:61`.

**Không sửa, không xóa hệ cũ trong phase này** — đó là việc của backend team. Chỉ đơn giản là không dùng.

## Tin tốt: service + hooks đã xong 100%

`src/services/session.service.ts` bọc đúng toàn bộ endpoint canonical. `src/hooks/queries/use-sessions.ts` có 22 hook. **0 consumer** — đây là gap UI thuần, không viết lại service.

Hook dùng được ngay:

| Hook | Endpoint |
|---|---|
| `useClassSessions(classId, params)` | `GET /classes/:classId/sessions` |
| `useSessionAttendances(sessionId)` | `GET /sessions/:sessionId/attendances` |
| `useMarkAttendance(sessionId)` | `POST /sessions/:sessionId/attendances` |
| `useBulkMarkAttendance(sessionId)` | `POST /sessions/:sessionId/attendances/bulk` |
| `useUpdateAttendance(sessionId)` | `PUT /sessions/:sessionId/attendances/:id` |
| `useCheckIn(sessionId)` | `POST /sessions/:sessionId/check-in` |
| `useCheckOut(sessionId)` | `POST /sessions/:sessionId/check-out` |
| `useMyAttendances(params)` | `GET /me/attendances` |
| `useMyTimetable(weekOffset)` | `GET /me/timetable` |
| `useGenerateSessions(classId)` | `POST /classes/:classId/sessions/generate` |

Trạng thái: `present` | `absent` | `late` | `excused` (đã có type `AttendanceStatus`).

## Phạm vi UI

### A. Giáo viên — điểm danh buổi học

Route mới: `src/app/(teacher)/teacher/classes/[classId]/attendance/page.tsx`

- Chọn buổi học từ `useClassSessions` (dropdown/list, mặc định buổi gần nhất)
- Bảng học sinh × trạng thái, dùng `ui/table`
- 4 nút trạng thái mỗi hàng (present/absent/late/excused) — bấm là đổi local state
- Nút "Đánh dấu tất cả có mặt" → set toàn bộ `present`
- Nút "Lưu" → `useBulkMarkAttendance` một lần cho cả lớp (không gọi từng người)
- Ô ghi chú tùy chọn mỗi học sinh (`note`)
- Hiện `late_minutes` nếu có, và giờ check-in nếu HS tự check-in trước đó
- Sửa lại bản ghi đã lưu → `useUpdateAttendance`

### B. Học sinh — chuyên cần của tôi

Route mới: `src/app/(app)/my-attendance/page.tsx`

- Thống kê tổng: % có mặt, số buổi vắng/trễ/có phép — tính từ `useMyAttendances`
- Bảng lịch sử theo buổi: ngày, lớp, trạng thái badge màu, số phút trễ
- Phân trang (`page`, `page_size` — API hỗ trợ)
- Cảnh báo khi tỉ lệ vắng cao (ngưỡng cứng 20%, để constant, không magic number)

### C. Học sinh — tự check-in

Component: `src/components/attendance/session-check-in.tsx`

- Nút check-in/check-out cho buổi đang diễn ra
- Nhúng vào trang lớp học/timetable
- Ẩn nếu buổi chưa bắt đầu hoặc đã điểm danh
- **Chưa rõ policy giới hạn thời gian/vị trí** → xem câu hỏi mở

## File liên quan

**Tạo:**
- `src/app/(teacher)/teacher/classes/[classId]/attendance/page.tsx`
- `src/app/(app)/my-attendance/page.tsx`
- `src/components/attendance/attendance-table.tsx` — bảng GV điểm danh
- `src/components/attendance/attendance-status-badge.tsx` — badge 4 trạng thái, tái dùng
- `src/components/attendance/attendance-stats.tsx` — thẻ thống kê HS
- `src/components/attendance/session-check-in.tsx`
- `src/components/attendance/index.ts` — barrel
- `src/components/attendance/__tests__/attendance-status-badge.test.tsx`
- `src/components/attendance/__tests__/attendance-stats.test.tsx`

**Sửa:**
- `src/components/layout/teacher-sidebar.tsx` — thêm link "Điểm danh"
- `src/components/layout/bottom-nav.tsx` hoặc sidebar HS — thêm link "Chuyên cần"
- `src/lib/routes.ts` — khai báo route mới (file này đang là nơi tập trung route)

**Không sửa:** `src/services/session.service.ts`, `src/hooks/queries/use-sessions.ts` — đã đúng.

## Các bước

1. Đọc `src/lib/routes.ts` + `teacher-sidebar.tsx` để bám convention route/nav.
2. Đọc một trang teacher có sẵn (`teacher/students/page.tsx`) để copy layout/loading/error pattern.
3. Viết `attendance-status-badge.tsx` trước — nhỏ nhất, tái dùng ở cả A và B.
4. Viết `attendance-table.tsx` (state local + bulk save).
5. Viết trang GV, nối `useClassSessions` + `useSessionAttendances` + `useBulkMarkAttendance`.
6. Viết `attendance-stats.tsx` + trang HS với `useMyAttendances`.
7. Viết `session-check-in.tsx`, nhúng vào timetable.
8. Thêm nav link + route constant.
9. Viết test component thuần (badge, stats).
10. `npx tsc --noEmit` → `npm run lint` → `npm run test` → `npm run build`.
11. Chạy dev, test thủ công với backend thật: điểm danh 1 lớp, xem lại ở trang HS.

## Todo

- [ ] `attendance-status-badge.tsx`
- [ ] `attendance-table.tsx`
- [ ] Trang GV điểm danh
- [ ] `attendance-stats.tsx`
- [ ] Trang HS chuyên cần
- [ ] `session-check-in.tsx`
- [ ] Nav link + `routes.ts`
- [ ] Test component
- [ ] tsc + lint + test + build sạch
- [ ] Verify thủ công end-to-end với backend

## Success criteria

- GV điểm danh cả lớp bằng **một** request bulk, không N request
- HS thấy đúng lịch sử + % chuyên cần
- Mọi request đi tới `/sessions/:sessionId/attendances`, **không** endpoint deprecated
- `npm run build` + `npm run test` xanh
- Không mock data, chạy thật với backend

## Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Vô tình dùng hệ attendance cũ | Bảng chốt endpoint ở đầu file này; test service ở phase 02 assert URL |
| Không có sẵn danh sách HS của buổi học | `useSessionAttendances` trả bản ghi đã có; nếu buổi chưa điểm danh cần lấy roster từ `/classes/:classId/members` — kiểm tra khi code |
| Bulk save mất dữ liệu nếu request lỗi | Giữ local state cho tới khi mutation success; toast lỗi, không clear form |
| Xung đột khi 2 GV điểm danh cùng buổi | Backend có unique `(session_id, student_id)`; hiện chấp nhận last-write-wins |

## Bảo mật

- Gate trang GV theo role `teacher` — dùng guard pattern có sẵn (`RoleGuard` / `domain-access-policy.ts`)
- Không tin `classId`/`sessionId` từ URL — backend đã check auth, nhưng UI vẫn phải xử lý 403 tử tế
- HS chỉ được xem chuyên cần của chính mình (`/me/attendances` đã tự scope theo token)

## Câu hỏi mở

1. Buổi chưa điểm danh lần nào thì lấy roster học sinh từ đâu? Cần xác nhận `/classes/:classId/members` trả gì.
2. Ai được điểm danh — chỉ GV chủ nhiệm hay cả trợ giảng? Backend chỉ check `auth`, chưa check role. Tạm gate `teacher`.
3. HS tự check-in có giới hạn thời gian/vị trí? Model có `Location` + `DeviceInfo` nhưng chưa thấy policy enforce.

## Bước tiếp

Sau phase này, thêm `e2e/attendance.spec.ts` vào bộ e2e của phase 02.
