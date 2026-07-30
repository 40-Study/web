# Phase 04 — Certificate UI + trang verify công khai

**Ưu tiên:** P1 | **Trạng thái:** chưa bắt đầu | **Phụ thuộc:** phase 01 (bắt buộc), phase 02

## Phát hiện quyết định kiến trúc: backend KHÔNG sinh PDF

Đã xác minh trong `internal/service/certificate_service.go`:

- Dòng 45: comment `"CertificateGenerationMessage is pushed to RabbitMQ for PDF generation"`
- Dòng 78: publish message vào queue
- Dòng 201: `SetupQueue("certificate", "certificate.generate", ...)` — chỉ **declare** queue
- **Không tìm thấy consumer/worker nào** đọc queue này
- `go.mod` **không có thư viện PDF** nào (không gofpdf, maroto, chromedp)

→ Message vào queue rồi nằm đó. **`certificate_url` sẽ null mãi.**

**Kết luận: web tự render chứng chỉ client-side.** Đây là sự thật đã kiểm chứng, không phải giả định. Vẫn đọc `certificate_url` và ưu tiên dùng nếu một ngày backend có worker — nhưng không phụ thuộc vào nó.

## Endpoint (xem contract đầy đủ ở phase 01)

| Endpoint | Auth | Ghi chú |
|---|---|---|
| `GET /certificates` | ✅ | list của tôi, phân trang |
| `GET /certificates/:id` | ✅ | chi tiết |
| `POST /certificates` | ✅ | cấp mới, body `{course_id, enrollment_id}` |
| `GET /certificates/verify/:number` | ❌ **public** | tra cứu, không cần login |

Hooks đã có sẵn trong `src/hooks/queries/use-certificates.ts`: `useMyCertificates`, `useCertificate`, `useVerifyCertificate`, `useIssueCertificate`.

## Phạm vi UI

### A. Chứng chỉ của tôi

Route mới: `src/app/(app)/certificates/page.tsx`

- Grid thẻ chứng chỉ từ `useMyCertificates` (phân trang)
- Mỗi thẻ: tên khóa học, số chứng chỉ, ngày cấp, nút xem/tải
- Empty state khi chưa có chứng chỉ nào — dẫn về `/my-courses`

### B. Chi tiết + tải

Route mới: `src/app/(app)/certificates/[id]/page.tsx`

- Render chứng chỉ đầy đủ bằng component `certificate-canvas`
- Nút "Tải PDF" — nếu `certificate_url` có thì mở link; nếu null thì render + xuất client-side
- Nút copy link verify công khai
- Nút chia sẻ LinkedIn (dùng URL verify công khai)

### C. Tra cứu công khai — quan trọng nhất

Route mới: `src/app/certificates/verify/[number]/page.tsx` (ngoài group `(app)`, **không** cần auth)

Cộng thêm form tra cứu tay: `src/app/certificates/verify/page.tsx`

- Nhập số chứng chỉ → `useVerifyCertificate`
- `valid: true` → hiện tên người học, tên khóa học, ngày cấp, dấu hợp lệ
- `valid: false` hoặc 404 → thông báo không tìm thấy, rõ ràng, không lộ thông tin gì
- Đây là trang public nên **phải** có `generateMetadata` cho SEO/OG (khớp phase 05)

### D. Render chứng chỉ

Component: `src/components/certificate/certificate-canvas.tsx`

- Layout chứng chỉ: tên người học, khóa học, ngày, số chứng chỉ, chữ ký/logo
- Xuất ảnh/PDF client-side
- **Cần thêm dependency** — xem mục dưới

## Dependency mới

Render PDF client-side cần thư viện. Web hiện đã có `konva`/`react-konva` (dùng cho whiteboard) — có thể tái dùng để vẽ canvas rồi export PNG, tránh thêm package.

Hai lựa chọn, quyết khi bắt đầu code:
- **Tái dùng `konva`** (đã có): vẽ canvas → `toDataURL()` → tải PNG. Không thêm dep. PDF thì cần bước nữa.
- **Thêm `jspdf` + `html2canvas`**: render DOM → PDF trực tiếp. Thêm ~2 dep nhưng ra PDF thật.

Theo YAGNI: bắt đầu bằng **PNG qua konva** (không thêm dep). Chỉ thêm `jspdf` nếu người dùng thực sự cần đúng định dạng PDF.

## File liên quan

**Tạo:**
- `src/app/(app)/certificates/page.tsx`
- `src/app/(app)/certificates/[id]/page.tsx`
- `src/app/certificates/verify/page.tsx` — form tra cứu
- `src/app/certificates/verify/[number]/page.tsx` — kết quả, public
- `src/components/certificate/certificate-card.tsx`
- `src/components/certificate/certificate-canvas.tsx`
- `src/components/certificate/certificate-verify-result.tsx`
- `src/components/certificate/index.ts`
- `src/components/certificate/__tests__/certificate-card.test.tsx`
- `src/components/certificate/__tests__/certificate-verify-result.test.tsx`

**Sửa:**
- `src/middleware.ts` — thêm `/certificates/verify` vào `PUBLIC_ROUTES` ⚠️ **bắt buộc**, không có bước này trang verify sẽ bị redirect về login
- `src/lib/routes.ts` — route constant
- `src/components/layout/footer.tsx` — footer đã nhắc certificate, trỏ link thật vào form tra cứu
- `src/app/(app)/my-courses/page.tsx` — link tới `/certificates` (đang chỉ đếm `.total`)

## Các bước

1. **Xác nhận phase 01 đã xong** — không thì mọi field đọc ra `undefined`.
2. Đọc `src/middleware.ts` để hiểu `PUBLIC_ROUTES` matching, thêm route verify.
3. Viết `certificate-card.tsx` + trang list.
4. Viết `certificate-verify-result.tsx` + 2 trang verify (public) — làm sớm vì đây là phần giá trị nhất.
5. Test route public bằng cửa sổ ẩn danh (chưa login) — phải xem được.
6. Viết `certificate-canvas.tsx` render bằng konva, export PNG.
7. Trang chi tiết + nút tải + copy link + share.
8. Thêm `generateMetadata` cho trang verify.
9. Sửa footer + link từ my-courses.
10. Viết test component.
11. `tsc --noEmit` → `lint` → `test` → `build`.
12. Verify thủ công: cấp 1 chứng chỉ thật, mở link verify ở chế độ ẩn danh.

## Todo

- [ ] Xác nhận phase 01 xong
- [ ] `middleware.ts` thêm `/certificates/verify` vào PUBLIC_ROUTES
- [ ] `certificate-card.tsx` + trang list
- [ ] `certificate-verify-result.tsx` + 2 trang verify
- [ ] Test public access ở chế độ ẩn danh
- [ ] `certificate-canvas.tsx` (konva → PNG)
- [ ] Trang chi tiết + tải + share
- [ ] `generateMetadata` cho trang verify
- [ ] Sửa footer + my-courses link
- [ ] Test component
- [ ] tsc + lint + test + build sạch

## Success criteria

- Trang `/certificates/verify/[number]` mở được **khi chưa đăng nhập**
- Số chứng chỉ hợp lệ → hiện đúng tên người học + khóa học + ngày cấp
- Số không hợp lệ → thông báo rõ ràng, không leak dữ liệu
- Tải được chứng chỉ dù `certificate_url` là null
- `npm run build` + `npm run test` xanh

## Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Trang verify bị middleware chặn | Bước 2 làm trước mọi thứ; test bằng ẩn danh |
| `certificate_url` null | Đã tính từ đầu — render client-side là đường chính |
| Render canvas khác nhau giữa browser | Chốt font/size cố định, test Chrome + Firefox |
| Field `undefined` do contract sai | Phase 01 là hard dependency |

## Bảo mật

- Trang verify là public → **chỉ** hiện field backend trả trong `VerifyCertificateResponseDTO` (`user_name`, `course_name`, `issued_at`). Không gọi thêm endpoint auth, không hiện `user_id`/`enrollment_id`.
- Không cho đoán số chứng chỉ hàng loạt — nếu backend chưa rate-limit endpoint này thì ghi nhận là việc của backend, không tự ý thêm client-side (vô dụng).
- `POST /certificates` chỉ gọi từ luồng hoàn thành khóa học, không expose nút "tự cấp chứng chỉ".

## Câu hỏi mở

1. Backend có kế hoạch viết worker sinh PDF không? Nếu có thì web render chỉ là tạm. Nếu không, nên xóa queue publish để tránh message dồn vô ích — **việc của backend team, cần báo**.
2. Chứng chỉ cần chữ ký/logo/con dấu gì? Cần asset thiết kế từ phía người dùng.
3. Điều kiện cấp chứng chỉ (hoàn thành 100% hay đạt điểm tối thiểu)? Hiện `POST /certificates` nhận `enrollment_id` mà chưa rõ backend có validate không.

## Bước tiếp

Trang verify là public → phối hợp với phase 05 để vào `sitemap` (chỉ trang form, **không** đưa số chứng chỉ cụ thể vào sitemap).
