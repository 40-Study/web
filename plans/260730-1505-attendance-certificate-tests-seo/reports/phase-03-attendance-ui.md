# Report — Phase 03: Attendance UI

**Ngày:** 2026-07-31 | **Repo:** `40-Study/web` branch `test` | **Commit:** `5cb2e66`

## Kết quả

| Kiểm tra | Kết quả |
|---|---|
| `npm run test` | **38/38 pass**, 5 file (+17 test mới) |
| `npx tsc --noEmit` | **0 lỗi** |
| `npm run build` | **exit 0**, 0 lỗi ESLint |
| Route mới trong build | `/my-attendance` + `/teacher/classes/[classId]/attendance` |
| Mutation-test logic create/update | ✅ tiêm bug → 4 test đỏ |

## 🔴 Phát hiện nghiêm trọng — plan gốc SAI ở điểm cốt lõi

Plan viết: *"Nút Lưu → `useBulkMarkAttendance` một lần cho cả lớp (không gọi từng người)"*. **Làm vậy sẽ hỏng.**

`internal/service/schedule_service.go:507-518`:

```go
func (s *ScheduleService) BulkMarkAttendance(...) {
    for _, item := range req.Attendances {
        result, err := s.MarkAttendance(ctx, sessionID, item, verifiedBy)
        if err != nil {
            log.Printf("BulkMarkAttendance: skip student %s: %v", ...)
            continue          // ← nuốt lỗi, KHÔNG báo về client
        }
        ...
    }
    return results, nil       // ← luôn 200 OK
}
```

Và `MarkAttendance` (dòng 481-484) **trả lỗi** nếu HS đã có bản ghi:
```go
existing, _ := s.repo.GetAttendanceBySessionAndStudent(...)
if existing != nil {
    return nil, errors.New("attendance already recorded for this student")
}
```

**Hệ quả:** GV điểm danh lần 2 để sửa → bulk bỏ qua toàn bộ HS đã có bản ghi, trả 200 OK, UI báo "Đã điểm danh hàng loạt" — **nhưng không có gì được lưu**. Bug im lặng, không cách nào phát hiện từ phía client.

**Giải pháp đã áp dụng** (`use-attendance-draft.ts`): tách 2 nhóm khi lưu
- HS **chưa** có bản ghi → gom vào **1 request** `bulkMarkAttendance`
- HS **đã** có bản ghi → `updateAttendance` (PUT) từng cái

Khoá bằng test. Mutation-test: sửa `if (!existing)` thành `if (true)` (gộp hết vào bulk) → 4 test đỏ ngay.

## Câu hỏi mở của plan — đã tự trả lời bằng code

**1. Roster khi buổi chưa điểm danh?** `GetSessionAttendances` chỉ trả bản ghi đã có → buổi mới trả mảng rỗng. Phải merge với roster lớp.

Backend đăng ký `GET /classes/:id/students` (`class_router.go:35`, wired ở `route.go:93`) — **chỉ cần classId**, không cần courseId như `class.service.ts` đang dùng. Thêm `getStudentsByClassId()` + `useClassStudentsByClassId()` → route web chỉ cần `[classId]`, không phải fetch class chỉ để lấy `course_id`.

**2. Ai được điểm danh?** `(teacher)/layout.tsx` đã có `<RoleGuard roles={DOMAIN_ACCESS_POLICY.teacher}>` → trang nằm trong group này tự động được bảo vệ. Không cần thêm guard. Backend vẫn chỉ check `auth`, chưa phân biệt GV chủ nhiệm vs trợ giảng.

**3. Check-in có giới hạn thời gian/vị trí?** Backend `StudentCheckIn` là upsert, tự set `status="present"`, **không** kiểm tra thời gian hay vị trí. `StudentCheckOut` báo lỗi nếu chưa check-in → UI chỉ hiện nút check-out sau khi đã check-in.

## File

**Tạo (10):** `components/attendance/` — `attendance-status-badge.tsx`, `attendance-table.tsx`, `attendance-stats.tsx`, `session-check-in.tsx`, `use-attendance-draft.ts`, `index.ts`, 2 file test; `app/(teacher)/teacher/classes/[classId]/attendance/page.tsx`; `app/(app)/my-attendance/page.tsx`

**Sửa (4):** `class.service.ts` (+`getStudentsByClassId`), `use-classes.ts` (+hook + query key), `layout/sidebar.tsx` (+link "Chuyên cần" cho HS), `teacher/courses/[id]/page.tsx` (+nút "Điểm danh" trong dialog quản lý lớp)

Mọi file dưới 200 dòng — logic merge/save tách khỏi UI thành hook riêng.

## Quyết định thiết kế

- **Không toast success ở page**: `useBulkMarkAttendance`/`useUpdateAttendance` đã tự toast bên trong. Thêm nữa thành double-toast. Giữ `toast.error` vì lỗi cần rõ.
- **Lỗi thì giữ nguyên draft**, không clear — GV không mất dữ liệu đã nhập.
- **Đi trễ tính là tham dự** trong `presentRate` (HS vẫn tới lớp); `absenceRate` chỉ đếm `absent`, không tính `excused`.
- **Ngưỡng cảnh báo vắng 20%** đặt thành hằng số `ABSENCE_WARNING_RATIO`, không magic number.
- **Không chèn vào `bottom-nav`** — đã đủ 5 mục mỗi role (chuẩn mobile). Link HS vào `sidebar.tsx`; link GV đặt tại nơi có `classId` trong ngữ cảnh.

## Chưa làm

`SessionCheckIn` đã viết và export nhưng **chưa nhúng vào trang nào**. Chỗ hợp lý là `/schedule` (trang lịch học của HS) — nhưng đó là code của người khác và cần biết buổi nào đang diễn ra để hiện nút. Để lại quyết định cho chủ trang.

## Câu hỏi chưa giải quyết

1. Nhúng `SessionCheckIn` vào `/schedule` không? Cần chủ trang đồng ý + logic xác định buổi đang diễn ra.
2. Thống kê ở `/my-attendance` tính trên **trang hiện tại**, không phải toàn bộ lịch sử (backend ép `page_size` ≤ 50, không có endpoint trả tổng hợp). Đã ghi chú rõ trên UI. Cần endpoint thống kê riêng nếu muốn số liệu toàn cục.
3. **Backend nên sửa:** `BulkMarkAttendance` nuốt lỗi im lặng — nên trả danh sách skip về client thay vì chỉ log. Web đã né được, nhưng client khác (mobile) sẽ dính bug này.
4. Chưa test thật với backend đang chạy — mới verify build + unit test. Cần chạy dev + backend để xác nhận end-to-end.
