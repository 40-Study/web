# Phase 01 — Sửa contract `certificate.service.ts`

**Ưu tiên:** P0 (blocker cho phase 04) | **Trạng thái:** chưa bắt đầu | **Ước lượng:** nhỏ, 1 file

## Bối cảnh

`src/services/certificate.service.ts` được viết theo contract **đoán**, không khớp DTO backend. TypeScript vẫn pass vì service tự nhất quán nội bộ → lỗi chỉ lộ ra ở runtime dưới dạng `undefined`.

Chưa vỡ hiện tại vì 2 consumer duy nhất chỉ đọc `.total` (field này khớp cả hai bên):
- `src/app/(app)/achievements/page.tsx:412` → `certificatesData?.total`
- `src/app/(app)/my-courses/page.tsx:66` → `certificatesData?.total`

## Contract backend thực tế (đã xác minh)

Nguồn: `internal/dto/certificateDTO.go`, `internal/handler/certificate_handler.go`, `internal/service/certificate_service.go`.

Mọi response bọc trong `{message, data}`.

| Endpoint | Auth | `data` shape |
|---|---|---|
| `POST /certificates` | ✅ | `CertificateResponseDTO` |
| `GET /certificates` | ✅ | `CertificateListDTO` |
| `GET /certificates/:id` | ✅ | `CertificateResponseDTO` |
| `GET /certificates/verify/:number` | ❌ **public** | `VerifyCertificateResponseDTO` |

```go
CertificateResponseDTO {
  id, user_id, user_name, course_id, course_name,
  enrollment_id, certificate_number,
  certificate_url *string,   // NULLABLE
  issued_at, created_at
}
CertificateListDTO          { data[], total, page, page_size }
VerifyCertificateResponseDTO{ valid, certificate_number, user_name, course_name, issued_at }
```

## Bảng lệch cần sửa

| Web hiện tại | Backend đúng |
|---|---|
| `pdf_url?` | `certificate_url?` |
| `course?: {id,title,thumbnail}` (lồng) | `course_name: string` (phẳng) |
| `user?: {id,name}` (lồng) | `user_name: string` (phẳng) |
| `CertificateListResponse.certificates[]` | `.data[]` |
| `VerifyCertificateResponse.holder_name` | `user_name` |
| `VerifyCertificateResponse.course_title` | `course_name` |
| `VerifyCertificateResponse.certificate?` (object lồng) | không tồn tại — field phẳng |

## File liên quan

**Sửa:**
- `src/services/certificate.service.ts` — toàn bộ interface
- `src/hooks/queries/use-certificates.ts` — kiểm tra lại nếu hook có map field

**Kiểm tra không vỡ (không sửa nếu vẫn đúng):**
- `src/app/(app)/achievements/page.tsx`
- `src/app/(app)/my-courses/page.tsx`

## Các bước

1. Đọc `internal/dto/certificateDTO.go` một lần nữa để chốt tên field chính xác.
2. Viết lại `Certificate` interface theo shape phẳng: `user_name`, `course_name`, `certificate_url?`.
3. Đổi `CertificateListResponse.certificates` → `data`.
4. Viết lại `VerifyCertificateResponse` thành shape phẳng, bỏ `certificate?` lồng.
5. Giữ nguyên `IssueCertificateDTO` — `{course_id, enrollment_id}` đã khớp handler.
6. `npx tsc --noEmit` → sửa mọi call site bị đỏ.
7. Chạy dev, mở `/achievements` + `/my-courses`, xác nhận số chứng chỉ vẫn hiện đúng.

## Todo

- [ ] Rewrite `Certificate` interface (flat)
- [ ] Rewrite `CertificateListResponse` (`data` thay `certificates`)
- [ ] Rewrite `VerifyCertificateResponse` (flat)
- [ ] `tsc --noEmit` sạch
- [ ] Verify 2 consumer cũ vẫn chạy đúng trên dev

## Success criteria

- Mọi field trong service khớp byte-for-byte với JSON tag của Go DTO
- `npx tsc --noEmit` không lỗi
- `/achievements` và `/my-courses` hiển thị đúng số chứng chỉ như trước

## Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Đổi type làm vỡ call site chưa biết | `tsc --noEmit` bắt hết trước khi chạy |
| Backend đổi DTO sau này | Ghi rõ nguồn contract trong comment đầu file service |

## Bước tiếp

Mở đường cho phase 04. Không phụ thuộc phase 02, có thể làm song song.
