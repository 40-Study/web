# Phase 05 — SEO (sitemap / robots / manifest / OpenGraph)

**Ưu tiên:** P1 | **Trạng thái:** chưa bắt đầu | **Phụ thuộc:** không — chạy song song bất cứ lúc nào

## Bối cảnh

Đã xác minh thiếu hoàn toàn: không `src/app/sitemap.ts`, không `robots.ts`, không `manifest.ts`. `src/app/layout.tsx:13` đã có `metadata` cơ bản (`title` template + `description`) — đây là nền tốt, chỉ cần mở rộng.

Hệ quả hiện tại: trang khóa học công khai không được Google index. Với nền tảng giáo dục, organic search là kênh tiếp cận chính — đang bỏ trắng.

Next 14 App Router hỗ trợ sẵn file convention cho cả 3 (`sitemap.ts`, `robots.ts`, `manifest.ts`), không cần thư viện ngoài. **Không thêm dependency nào ở phase này.**

## Trang nào nên index

Quyết định dựa trên `PUBLIC_ROUTES` trong `src/middleware.ts`.

| Trang | Index? | Lý do |
|---|---|---|
| `/` landing | ✅ | trang chính |
| `/courses` | ✅ | danh sách khóa học |
| `/courses/[slug]` | ✅ | **quan trọng nhất** — nội dung thật, long-tail search |
| `/discussions`, `/discussions/[slug]` | ✅ | nội dung do người dùng tạo, tốt cho SEO |
| `/certificates/verify` (form) | ✅ | trang tra cứu công khai |
| `/certificates/verify/[number]` | ❌ | dữ liệu cá nhân, **không** đưa vào sitemap |
| `/login`, `/register`, `/otp`, `/reset-password` | ❌ | không có giá trị search |
| `/(app)/*`, `/(teacher)/*`, `/(admin)/*`, `/(dashboard)/*` | ❌ | cần auth |
| `/403` | ❌ | trang lỗi |

## Sitemap động

`src/app/sitemap.ts` phải fetch danh sách khóa học từ backend để sinh URL động.

- Endpoint: `GET /courses` (đã có trong `src/services/course.service.ts`)
- Chạy server-side → dùng `src/lib/server-api.ts` hoặc `server-fetchers/`, **không** dùng `api-client.ts` (cái đó cấu hình cho browser với cookie)
- Backend có thể trả nhiều trang → phân trang cho tới hết, hoặc lấy `page_size` lớn
- Thêm `revalidate` để sitemap không fetch mỗi request
- **Fail-safe:** nếu backend chết, trả về sitemap tĩnh (chỉ route cố định) thay vì để build vỡ. Log lỗi ra, không im lặng.

## OpenGraph cho trang khóa học

`src/app/(main)/courses/[slug]/page.tsx` — hiện chưa rõ có `generateMetadata` chưa, phải kiểm tra.

Cần: `title`, `description` (từ mô tả khóa học), `openGraph.images` (thumbnail khóa học), `twitter:card`.

Đây là phần cho ROI cao nhất — link khóa học chia sẻ lên Facebook/Zalo hiện ra thumbnail thay vì text trơn.

## Manifest (PWA cơ bản)

`src/app/manifest.ts` — chỉ mức metadata: `name`, `short_name`, `icons`, `theme_color`, `display: standalone`, `start_url`.

**Phase này không làm service worker / offline.** Đó là việc lớn hơn, tách riêng. Manifest chỉ để trang "cài được" lên home screen.

Cần kiểm tra `public/` đã có icon cỡ 192/512 chưa; nếu chưa thì cần asset.

## File liên quan

**Tạo:**
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/manifest.ts`
- `src/app/__tests__/sitemap.test.ts` — assert có route tĩnh, không chứa route auth

**Sửa:**
- `src/app/layout.tsx` — mở rộng `metadata`: `metadataBase`, `openGraph` mặc định, `twitter`
- `src/app/(main)/courses/[slug]/page.tsx` — thêm/bổ sung `generateMetadata`
- `src/app/(main)/discussions/[slug]/page.tsx` — thêm `generateMetadata`
- `.env.example` (nếu có) — thêm `NEXT_PUBLIC_SITE_URL`

## Các bước

1. Đọc `src/middleware.ts` chốt lại danh sách route public.
2. Kiểm tra `src/app/(main)/courses/[slug]/page.tsx` xem đã có `generateMetadata` chưa.
3. Thêm `metadataBase` vào root layout — dùng `NEXT_PUBLIC_SITE_URL`, fallback localhost. Thiếu cái này thì OG image URL tương đối sẽ sai.
4. Viết `robots.ts`: allow các route ở bảng trên, disallow `/api/`, `/(app)`, `/(teacher)`, `/(admin)`, `/certificates/verify/`, trỏ tới sitemap.
5. Viết `sitemap.ts` với route tĩnh trước — verify `/sitemap.xml` chạy được.
6. Thêm khóa học động vào sitemap, kèm try/catch fail-safe.
7. Viết `manifest.ts`; kiểm tra icon trong `public/`.
8. Thêm `generateMetadata` cho trang khóa học + thảo luận.
9. Test: mở `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` trên dev.
10. Verify OG bằng cách xem thẻ `<meta>` trong HTML source của một trang khóa học.
11. `npm run build` — quan trọng, sitemap fetch có thể vỡ lúc build.

## Todo

- [ ] `metadataBase` + OG mặc định trong root layout
- [ ] `robots.ts`
- [ ] `sitemap.ts` — route tĩnh
- [ ] `sitemap.ts` — khóa học động + fail-safe
- [ ] `manifest.ts` + kiểm tra icon
- [ ] `generateMetadata` cho `/courses/[slug]`
- [ ] `generateMetadata` cho `/discussions/[slug]`
- [ ] Test sitemap không chứa route auth
- [ ] Verify `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`
- [ ] `npm run build` sạch

## Success criteria

- `/sitemap.xml` trả XML hợp lệ, có URL khóa học động
- `/robots.txt` chặn đúng route auth-only và `/api/`
- Sitemap **không** chứa `/certificates/verify/[number]` hay route cần auth
- Trang khóa học có OG tags đầy đủ (title, description, image)
- `npm run build` sạch kể cả khi backend không phản hồi

## Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Sitemap fetch vỡ lúc build → build fail | try/catch, fallback sitemap tĩnh, log lỗi rõ |
| Dùng `api-client.ts` (browser) trong sitemap server-side | Dùng `server-api.ts` / `server-fetchers/` |
| Lộ route private qua sitemap | Test assert sitemap không chứa `/login`, `/admin`, `/teacher` |
| OG image URL tương đối → hỏng khi share | Bắt buộc có `metadataBase` |
| Thiếu icon 192/512 trong `public/` | Kiểm tra ở bước 7; nếu thiếu, báo cần asset |

## Bảo mật

- Sitemap chỉ chứa URL công khai. Số chứng chỉ cụ thể **không** bao giờ vào sitemap.
- `robots.ts` disallow `/api/` để crawler không đập vào backend.
- `NEXT_PUBLIC_SITE_URL` là public config, không phải secret — đặt trong `.env.example` được.

## Câu hỏi mở

1. Domain production là gì? Cần cho `metadataBase` + `NEXT_PUBLIC_SITE_URL`.
2. `public/` đã có icon PWA 192×192 và 512×512 chưa? Nếu chưa cần asset thiết kế.
3. Có muốn index trang `/discussions` không? Nội dung người dùng tạo có thể chưa được kiểm duyệt — cân nhắc `noindex` cho tới khi có moderation.
