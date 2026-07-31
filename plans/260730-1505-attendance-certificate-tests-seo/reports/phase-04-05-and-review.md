# Report — Phase 04 + 05 + review vòng cuối

**Ngày:** 2026-07-31 | **Branch:** `test` | **Commit:** `2dd8dae`, `8d28002`, `0fd68fe`

## Trạng thái cuối — cả 5 phase hoàn thành

| Kiểm tra | Kết quả |
|---|---|
| `npm run test` (Vitest) | **55/55 pass**, 7 file |
| `npx playwright test` (e2e thật) | **12 pass, 1 skip**, 0 fail |
| `npx tsc --noEmit` | **0 lỗi** |
| `npm run build` | **exit 0**, 0 lỗi ESLint |

| Phase | Trạng thái |
|---|---|
| 01 — contract certificate | ✅ `44d2e1a` |
| 02 — hạ tầng test | ✅ `51c156b` |
| 03 — attendance UI | ✅ `5cb2e66` |
| 04 — certificate UI + verify công khai | ✅ `2dd8dae` |
| 05 — SEO | ✅ `8d28002` |
| review + e2e | ✅ `0fd68fe` |

## Phase 04 — lệch khỏi plan có chủ đích

**Render chứng chỉ: HTML + CSS print, KHÔNG dùng konva/canvas như plan.**
Lý do: không thêm dependency nào; trình duyệt đã có sẵn "In → Lưu thành PDF" cho ra PDF **vector** sắc nét ở mọi khổ giấy, trong khi canvas chỉ cho ảnh raster và phải vẽ tay từng dòng chữ. Đây là đường chính để lấy chứng chỉ (không phải fallback) vì `certificate_url` từ backend luôn null.

**Bẫy đã tránh:** CSS print phải scope bằng `body:has(.certificate-sheet)`. Nếu viết thẳng `body * { visibility: hidden }` thì quy tắc áp lên **mọi trang** và phá chức năng in của cả app.

**Không dùng `serverFetch`** cho trang verify: hàm đó forward cookie người dùng, mà endpoint verify là public — gửi cookie sang là thừa và làm lộ phiên đăng nhập trong request không cần danh tính. Viết `verifyCertificateServer` riêng, cache 300s.

**Plan sai một điểm — đã bỏ:** plan nói phải thêm `/certificates/verify` vào `PUBLIC_ROUTES` của middleware. Không cần: middleware không chặn gì (đã xác minh ở phase 01–02), gate thật là `RoleGuard` trong `(app)/layout.tsx`. Đặt trang trong group `(main)` là đủ.

**Footer:** link "Chứng chỉ" → `/certificates` cũ trỏ vào trang bị `RoleGuard` chặn, mà footer hiện cả với khách vãng lai. Đổi thành "Tra cứu chứng chỉ" → `/certificates/verify`.

## Phase 05 — phát hiện làm hỏng giả định của plan

🔴 **Trang chi tiết khóa học KHÔNG public.** `src/app/(app)/courses/[slug]/page.tsx` nằm trong group `(app)` → bị `RoleGuard` chặn. Chỉ trang *danh sách* `/courses` (ở `(main)`) là công khai.

Plan phase 05 xếp `/courses/[slug]` là "quan trọng nhất, phải index". **Không làm được** ở trạng thái hiện tại. Đưa URL bị chặn vào sitemap sẽ khiến Google thấy trang rỗng/redirect → bị đánh **soft-404**, hại hơn là không khai báo.

→ Sitemap hiện chỉ chứa 4 path thật sự public: `/`, `/courses`, `/discussions`, `/certificates/verify`. Đã khoá bằng test.

**Chi tiết kỹ thuật:** `robots` disallow ghi `"/certificates/verify/"` **có dấu `/` cuối** — robots.txt khớp theo tiền tố, nên chặn được trang kết quả theo mã (dữ liệu cá nhân) mà vẫn cho index trang form. Bỏ dấu `/` là vô tình chặn cả form.

**Manifest** cố tình chỉ ở mức metadata, **không** service worker/offline — đó là hạng mục riêng lớn hơn nhiều. Icon dùng tạm `logo.png` vì `public/` chỉ có mỗi file đó.

## Review — e2e chạy thật lần đầu, phát hiện test giả

Chạy `npx playwright test` lần đầu → **2 test auth fail** với `missing required error components, refreshing...` (lỗi khi `.next` còn build production mà chạy dev — không phải lỗi code). Xóa `.next` + giải phóng port 3000 → pass.

**Nhưng đó mới là điều đáng giá:** lúc trang đang hỏng, test `public-pages` vẫn **pass** — vì nó chỉ assert "body không rỗng", mà chuỗi lỗi cũng làm body khác rỗng. Test giả.

Đã siết: assert thêm `HTTP status < 400` và body không chứa `missing required error components` / `Application error` / `Unhandled Runtime Error` / `This page could not be found`.

Thêm `e2e/certificates-seo.spec.ts` — 6 test cho trang tra cứu công khai + 3 file SEO, chạy được **không cần backend** (đúng thiết kế: backend chết thì trang báo "không tìm thấy", không vỡ).

**Sửa thêm khi review:** trang chi tiết chứng chỉ dùng `window.location.origin` → SSR lần đầu chưa có `window` nên link xác minh thiếu domain rồi mới đổi sau hydrate. Đổi sang `SITE_URL`.

## 🔴 Lỗ hổng bảo mật BACKEND — cần báo team

`GET /certificates/:id` **không kiểm tra quyền sở hữu**:

```go
// internal/handler/certificate_handler.go:90
func (h *CertificateHandler) GetCertificateByID(c *fiber.Ctx) error {
    id, err := uuid.Parse(c.Params("id"))     // chỉ parse id
    certificate, err := h.service.GetCertificateByID(c.Context(), id)
    // ← KHÔNG so userID trong token với certificate.UserID
```

Bất kỳ tài khoản đã đăng nhập nào biết UUID chứng chỉ đều đọc được chứng chỉ của **người khác** (IDOR). Route có `auth` middleware nên cần đăng nhập, nhưng không phân biệt chủ sở hữu.

Mức độ: dữ liệu lộ ra là tên + tên khóa học + ngày cấp — không phải mật khẩu, nhưng vẫn là dữ liệu cá nhân người khác. UUID khó đoán nên khai thác hàng loạt khó, song vẫn phải sửa.

**Không sửa từ web được** — phải thêm check ở backend. Web đã hạn chế hệ quả: trang chi tiết chỉ vào từ danh sách của chính mình.

## Danh sách cần báo backend team

1. **IDOR `GET /certificates/:id`** — thiếu check ownership (mục trên).
2. **`BulkMarkAttendance` nuốt lỗi im lặng** (`schedule_service.go:507-518`) — bỏ qua HS đã có bản ghi, chỉ `log.Printf`, vẫn trả 200 OK. Web đã né bằng cách tách create/update, nhưng client mobile sẽ dính.
3. **Queue `certificate.generate` không có consumer** — message publish rồi nằm đó; `go.mod` không có thư viện PDF. Hoặc viết worker, hoặc bỏ publish.
4. **Route attendance cũ đăng ký trùng** ở `class_router.go:38` và `course_router.go:61`, cùng trỏ hệ `attendances` đã deprecated.

## Câu hỏi chưa giải quyết

1. **Có chuyển `/courses/[slug]` ra group công khai không?** Đây là quyết định sản phẩm: cho khách xem trước nội dung khóa học (tốt cho SEO + chuyển đổi) hay bắt đăng nhập. Nếu chuyển thì sitemap thêm nhánh fetch động — hạ tầng đã sẵn.
2. **Domain production** cho `NEXT_PUBLIC_SITE_URL` — hiện fallback `localhost:3000`, sitemap/robots/OG sẽ sai khi deploy.
3. **Icon PWA 192/512** — đang dùng tạm `logo.png`.
4. **Asset chứng chỉ** — chữ ký, con dấu, logo in trên phôi.
5. `SessionCheckIn` viết xong nhưng chưa nhúng vào `/schedule` (từ phase 03).
6. Chưa test end-to-end với **backend chạy thật** — mọi thứ verify ở mức build + unit + e2e không backend. Cần một vòng với backend + dữ liệu thật.
7. `npm audit`: 25 lỗ hổng (14 high, 1 critical), pre-existing, chưa đụng.
