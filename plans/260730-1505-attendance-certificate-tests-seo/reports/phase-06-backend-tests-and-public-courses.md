# Report — Test backend + mở khóa học công khai

**Ngày:** 2026-07-31 | **Commit:** web `366e3ea`, backend `e9a0567`

## Kết quả

| Kiểm tra | Kết quả |
|---|---|
| Frontend `npm run test` | **56/56 pass**, 7 file |
| Frontend `npx tsc --noEmit` | **0 lỗi** |
| Frontend `npm run build` | **exit 0** |
| **Backend `go test ./...`** | **14/14 pass**, 2 package |
| **Backend `go vet` + `go build`** | **0 lỗi** |
| **E2E với backend THẬT đang chạy** | **13/13 pass**, 1 skip |

## Backend — từ 0 test lên 14 test

Repo backend trước đó **không có file test nào**. Không dùng testify (thêm dependency không cần thiết) — stdlib `testing` là đủ. Test chạy **không cần DB/redis/rabbitmq** nhờ stub.

**`internal/handler/certificate_handler_test.go`** (6 test) — stub `CertificateServiceInterface`, dựng `fiber.New()` + `app.Test()`. Khoá đúng contract HTTP mà frontend đọc:
- `verify` trả `user_name`/`course_name` phẳng, **không** `holder_name`/`course_title`
- danh sách nằm ở `data`, **không** `certificates`
- **không** có `pdf_url` (tên thật là `certificate_url`)
- mã sai → 404 và không kèm `data` (endpoint công khai, không lộ dữ liệu)

Đây chính xác là những chỗ frontend từng viết sai contract và đọc ra `undefined`. Giờ cả hai phía đều có test khoá lại.

**`internal/service/schedule_attendance_test.go`** (8 test) — stub repo bằng cách nhúng `ScheduleRepositoryInterface` (nil) rồi override đúng 4 method cần; method chưa override sẽ panic, đó là chủ ý.

Test `TestBulkMarkAttendance_SilentlySkipsExistingRecords` **ghi lại bug bằng code**. Chạy thật cho ra log:

```
BulkMarkAttendance: skip student 99994f4c-...: attendance already recorded for this student
XAC NHAN: bulk bo qua ban ghi da ton tai ma khong bao loi cho client
```

Test cố ý khoá **hành vi hiện tại** để mô tả đúng sự thật. Khi backend được sửa để trả danh sách bị bỏ qua, test này sẽ đỏ — đó là tín hiệu đúng, không phải lỗi test.

Thêm `Makefile` (`test`/`vet`/`build`/`check`) cho CI; ghi rõ Windows không có `make` nên chạy thẳng lệnh `go`.

## Mở `/courses/[slug]` công khai — move file là chưa đủ

Chuyển `(app)/courses/[slug]` → `(main)/courses/[slug]`. Backend đã sẵn sàng: `GET /courses/slug/:slug` không có auth middleware (`course_router.go:30`).

🔴 **Cái bẫy:** `useEnrolledCourses` gọi `/enrollments` vô điều kiện. Khách chưa đăng nhập → 401 → `api-client.ts:91` ép `window.location.href = "/login"` → **khách bị đá khỏi trang công khai**. Chỉ move file thì trang vẫn không dùng được.

Đã thêm `enabled: isAuthenticated` cho hook. Nút "Đăng ký" khi chưa đăng nhập → `/login?redirect=...` quay lại đúng khóa học.

Đã khoá bằng e2e: `trang chi tiết khóa học xem được khi chưa đăng nhập (không bị đá về login)`.

## Hoàn thiện SEO mà phase 05 chưa làm được

Trang đã công khai nên giờ làm được đúng như plan ban đầu:

- **`layout.tsx` mới** — `generateMetadata` fetch khóa học thật. Layout cũ chỉ đổi dấu gạch nối trong slug thành title, không đọc dữ liệu.
- **`sitemap.xml`** sinh URL từng khóa học đã publish. Backend chết → fetcher trả mảng rỗng, sitemap vẫn build với route tĩnh (có test).

**Kiểm chứng với backend thật:**

```
/                                          200
/courses                                   200
/courses/git-github-cho-nguoi-moi-bat-dau  200
/sitemap.xml                               200
```

Sitemap liệt kê đúng khóa học trong DB (`git-github-...`, `docker-kubernetes-thuc-chien`, `flutter-mobile-development`, `python-cho-khoa-hoc-du-lieu`). Thẻ meta render đúng:

```html
<title>Git &amp; GitHub cho người mới bắt đầu | ForteX</title>
<meta property="og:title" content="Git &amp; GitHub cho người mới bắt đầu">
<meta property="og:image" content="https://picsum.photos/seed/git-github-.../800/450">
<meta name="twitter:card" content="summary_large_image">
```

## Bẫy môi trường gặp phải (ghi lại để khỏi mất thời gian lần sau)

**`rm -rf .next` khi dev server đang chạy làm hỏng server đó.** Playwright có `reuseExistingServer: true` nên tái dùng server hỏng → mọi route trả 404, và server mới bị đẩy sang port 3001 trong khi test gõ vào 3000. Triệu chứng dễ hiểu nhầm thành route conflict.

Cách xử lý: dừng process giữ port 3000/3001 trước, rồi để Playwright tự dựng server sạch.

## Câu hỏi chưa giải quyết

1. **`.env.bak.remote` trong repo backend đang untracked và không bị `.gitignore`** — `git add -A` sẽ nuốt vào. Web đã siết `.env.*`; backend chưa. Chưa tự sửa vì `.gitignore` backend là file chung của team.
2. Backend còn nhiều file untracked của người khác (`cmd/seed/`, `internal/database/seeds/*`, `tmp/*.log`, `docs/local-development-seed.md`) — không đụng.
3. **IDOR `GET /certificates/:id`** vẫn chưa sửa (đã ghi TODO trong test). Cần backend so `user_id` trong token với chủ chứng chỉ.
4. **`BulkMarkAttendance` nuốt lỗi** vẫn chưa sửa — nên trả danh sách bị bỏ qua về client. Web đã né, mobile sẽ dính.
5. E2E đăng nhập thật vẫn skip (thiếu `E2E_EMAIL`/`E2E_PASSWORD`). Có seed data trong DB nên tạo được tài khoản test.
6. Test backend mới phủ certificate + attendance. Các domain khác (auth, course, order, payment) vẫn 0 test.
7. `NEXT_PUBLIC_SITE_URL` vẫn là `localhost:3000` — sitemap/OG sẽ sai khi deploy.
