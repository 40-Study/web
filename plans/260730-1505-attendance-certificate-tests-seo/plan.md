# Attendance UI + Certificate + Test Infra + SEO

**Created:** 2026-07-30 | **Repo:** `40-Study/web` (branch `test`) | **Backend:** `40-Study/backend` @ `6ca6179`

## Mục tiêu

Bổ sung 4 hạng mục web đang thiếu, tất cả đã xác minh bằng code (không suy đoán).

## Phát hiện then chốt (đọc trước khi code)

1. **Attendance: service + hooks ĐÃ XONG, chỉ thiếu UI.** `src/services/session.service.ts` bọc đúng toàn bộ endpoint canonical; `src/hooks/queries/use-sessions.ts` có 22 hook — nhưng **0 consumer**. Đây là gap UI thuần, không cần viết service.

2. **Backend có 2 hệ điểm danh song song. Hệ cũ đã deprecated.**
   - ❌ CŨ: `attendances` table, `AttendanceHandler`, routes `/classes/:classId/attendances` (đăng ký trùng ở `class_router.go:38` VÀ `course_router.go:61`). Model comment `internal/model/schedule.go:89`: *"thay the Attendance cu"*.
   - ✅ CHUẨN: `session_attendances` table, `ScheduleHandler`, routes `/sessions/:sessionId/attendances`.
   - **TUYỆT ĐỐI không build trên hệ cũ.**

3. **`certificate.service.ts` sai contract vs backend** — 5 field lệch. TS vẫn pass vì service tự nhất quán; gọi thật ra `undefined`. Hiện chưa vỡ vì 2 consumer chỉ đọc `.total`. Phải sửa trước khi làm UI.

4. **Không có bất kỳ hạ tầng test nào** — không jest/vitest/playwright config, không thư mục test.

5. **Không có `sitemap.ts` / `robots.ts` / `manifest.ts`.** Root layout đã có `metadata` cơ bản.

6. **Backend không sinh PDF chứng chỉ.** Queue `certificate.generate` được declare + publish message, nhưng **không có consumer nào** và `go.mod` không có thư viện PDF. → `certificate_url` null mãi, web phải tự render. Chi tiết ở phase 04.

## Thứ tự phase

Hai phase enabler (nhanh, gỡ blocker) đi trước để mọi code sau đó vừa đúng contract vừa test được.

| # | Phase | Ưu tiên | Phụ thuộc | File |
|---|---|---|---|---|
| 01 | Sửa contract `certificate.service.ts` | P0 | — | [phase-01](phase-01-fix-certificate-contract.md) |
| 02 | Hạ tầng test (Vitest + Playwright) | P0 | — | [phase-02](phase-02-test-infrastructure.md) |
| 03 | Attendance UI (GV + HS) | P0 | 02 | [phase-03](phase-03-attendance-ui.md) |
| 04 | Certificate UI + verify công khai | P1 | 01, 02 | [phase-04](phase-04-certificate-ui.md) |
| 05 | SEO (sitemap/robots/manifest/OG) | P1 | — | [phase-05](phase-05-seo.md) |

Phase 05 độc lập hoàn toàn — chạy song song bất cứ lúc nào.

## Stack đã có (bám theo, không thêm mới)

- Next 14.2.20 App Router, React 18.3.1, TypeScript
- `@tanstack/react-query` v5 — mọi data fetch qua hook trong `src/hooks/queries/`
- `src/lib/api-client.ts` — axios, httpOnly cookie, `withCredentials`, proxy `/api`, auto-refresh 401
- UI primitives `src/components/ui/`: `table`, `tabs`, `dialog`, `badge`, `card`, `select`, `checkbox`, `skeleton`, `progress-bar`, `avatar`, `button`, `input`
- `src/middleware.ts` — `PUBLIC_ROUTES` array (phase 04 phải thêm route verify vào đây)
- Tailwind, `lucide-react`, `react-hot-toast`, `date-fns`

## Success criteria toàn cục

- [ ] `npm run build` sạch, không lỗi TypeScript
- [ ] `npm run lint` không lỗi mới
- [ ] `npm run test` xanh (sau phase 02)
- [ ] Mọi tính năng chạy thật với backend, không mock/fake data
- [ ] Không dùng endpoint deprecated `/classes/:classId/attendances`

## Rủi ro chính

| Rủi ro | Giảm thiểu |
|---|---|
| Build trên hệ attendance cũ | Phase 03 chốt endpoint ngay ở đầu file |
| `certificate_url` LUÔN null (không có worker) | Phase 04 render client-side là đường chính, không phải fallback |
| Sửa type certificate làm vỡ 2 consumer hiện tại | Phase 01 kiểm tra lại 2 call site đó |
| Test infra đụng config Next | Phase 02 dùng `vitest` + `@vitejs/plugin-react`, không chạm `next.config.mjs` |

## Câu hỏi chưa giải quyết

1. Ai được quyền điểm danh — chỉ giáo viên chủ nhiệm lớp, hay cả trợ giảng? Backend chỉ check `auth`, chưa thấy check role riêng. Phase 03 tạm gate theo role `teacher`.
2. Học sinh tự check-in (`POST /sessions/:sessionId/check-in`) có cần giới hạn thời gian/vị trí không? Model có `Location` + `DeviceInfo` nhưng chưa rõ policy.
3. Buổi học chưa điểm danh lần nào thì lấy roster học sinh từ đâu? Cần xác nhận `/classes/:classId/members` trả gì.
4. Domain production + icon PWA 192/512 trong `public/` — cần cho phase 05.
5. Chứng chỉ cần chữ ký/logo/con dấu gì? Cần asset thiết kế.

## Cần báo backend team (ngoài phạm vi web)

- Queue `certificate.generate` publish message nhưng không ai consume → message dồn vô ích. Hoặc viết worker, hoặc bỏ publish.
- Hệ attendance cũ (`/classes/:classId/attendances`) còn được đăng ký **trùng lặp** ở `class_router.go:38` và `course_router.go:61`. Nên dọn.
