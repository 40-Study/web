# Report — Phase 01 + 02 implementation

**Ngày:** 2026-07-30 | **Repo:** `40-Study/web` branch `test` | **Trạng thái:** ✅ hoàn thành

## Kết quả

| Hạng mục | Trạng thái |
|---|---|
| Phase 01 — sửa contract certificate | ✅ xong, `tsc` sạch |
| Phase 02 — hạ tầng test | ✅ xong, **21/21 test pass** (3 file) |
| Mutation-test hàng rào endpoint | ✅ verified — đổi sang route deprecated → test đỏ |
| Playwright + chromium | ✅ cài xong, 7 e2e test nhận diện |
| `npm run build` | ✅ **BUILD_EXIT=0**, 0 lỗi ESLint |
| `npx tsc --noEmit` | ✅ **TSC=0** — sạch hoàn toàn, lần đầu |
| Commit | ✅ `44d2e1a` + `51c156b` trên branch `test` |

## Phase 01 — sửa contract certificate

`src/services/certificate.service.ts` viết theo contract đoán. TS pass vì tự nhất quán; runtime ra `undefined`.

| Sai (cũ) | Đúng (backend DTO) |
|---|---|
| `pdf_url` | `certificate_url` |
| `course?: {title}` lồng | `course_name` phẳng |
| `user?: {name}` lồng | `user_name` phẳng |
| `CertificateListResponse.certificates[]` | `.data[]` |
| `holder_name` / `course_title` | `user_name` / `course_name` |
| `VerifyCertificateResponse.certificate?` lồng | không tồn tại — field phẳng |

Nguồn contract ghi vào docblock đầu file để không tái diễn.

**Fallout `tsc` bắt được:** `my-courses/page.tsx:106` dùng `.certificates` + `cert.course?.title` → sửa sang `.data` + `cert.course_name`. Đúng cái mìn plan dự đoán.

## Phase 02 — hạ tầng test

**Tạo:** `vitest.config.mts`, `vitest.setup.ts`, `src/test/mock-api.ts`, `src/test/utils.tsx`, `playwright.config.ts`, `e2e/auth.spec.ts`, `e2e/public-pages.spec.ts`, 2 file test service, `.npmrc`.

**Sửa:** `package.json` (scripts `test`/`test:watch`/`test:e2e`), `.gitignore` (artifact test), `.env.example` (biến E2E).

Quyết định kỹ thuật:
- **Không** bật `globals: true` → không phải đụng `tsconfig.json`; đổi lại test phải import `describe/it/expect` tường minh.
- `retry: false` + `gcTime: 0` trong test QueryClient — mặc định react-query retry 3 lần làm test lỗi bị treo tới timeout thay vì fail ngay.
- `vitest.config.mts` (không `.ts`) + `import.meta.dirname` → sạch warning `configLoader: 'native'` của Vite.
- `vi.mock` dùng factory async + dynamic import vì `vi.mock` bị hoist lên trên mọi import.

## Kiểm chứng test không phải test giả

Cố tình đổi `session.service.ts` sang endpoint deprecated `/classes/:id/attendances`:

```
× getAttendances -> GET /sessions/:sessionId/attendances
× markAttendance -> POST /sessions/:sessionId/attendances
Tests  2 failed | 19 passed (21)
```

Hàng rào hoạt động. Đã khôi phục, `git diff` rỗng, 21/21 xanh trở lại.

## Phát hiện làm sai lệch plan gốc

**1. Đã có sẵn 1 file test.** `src/lib/meet/getLiveKitURL.test.ts` (5 test, import `vitest`) tồn tại từ trước — plan ghi "không có bất kỳ test nào" là sai; chính xác là không có *hạ tầng* nên file này chưa từng chạy được. Nó cũng xác nhận người viết trước đã chọn Vitest. Giờ đã chạy và pass.

**2. `src/middleware.ts` KHÔNG chặn gì.** Dòng 43–45 luôn `return NextResponse.next()`; `PUBLIC_ROUTES` chỉ là early-return vô nghĩa vì nhánh fallthrough cũng cho qua. Gate thật là `<RoleGuard>` trong `src/app/(app)/layout.tsx`.

→ **Phase 04 phải sửa:** bước "thêm `/certificates/verify` vào `PUBLIC_ROUTES`" là **thừa**. Chỉ cần đặt trang verify NGOÀI group `(app)` là đủ public. Group `(main)` không có guard.

**3. npm install fail vì `~/.npmrc` global.** Có `scope=<private>` trỏ registry riêng → npm gửi MỌI scoped package (`@playwright/*`, `@testing-library/*`, `@vitejs/*`) sang đó, trả HTTP 530. Fix bằng `web/.npmrc` ghim `registry` + `scope=` rỗng, không đụng config global (project khác vẫn cần).

## 2 lỗi pre-existing chặn build — đã xử lý (user duyệt hướng A)

`next.config.mjs` không có `ignoreBuildErrors` nên cả hai chặn `npm run build` của repo, độc lập với phase 01/02.

**1. TS2322 `onSandboxOpen`** — `learn/[courseSlug]/[lessonId]/page.tsx:436` truyền prop không có trong `FloatingButtonsProps`. `FloatingButtons` tự quản lý `FloatingSandbox` nội bộ, còn trang lesson muốn mở `CodeEditorModal` riêng — code dở giữa một lần refactor.

→ Thêm `onSandboxOpen?: () => void` (optional). Handler: có prop thì gọi, không thì mở sandbox nội bộ. Backward-compatible, không phá hành vi bên nào.

**2. ESLint `prefer-const`** — `quiz-lesson-content.tsx:69`. Chỉ lộ ra SAU khi lỗi TS được sửa. Đổi `let` → `const`.

⚠️ **Lưu ý cho chủ nhân file:** biến `result` ở dòng 69 khai báo nhưng **không bao giờ được dùng** (grep toàn file chỉ ra 1 lần khai báo, 0 lần đọc) — dead code. Chỉ sửa `let`→`const` theo đúng cái lint đòi, KHÔNG xóa, để bạn tự quyết.

## Bảo mật — 2 việc phát hiện khi commit

**1. `.env.bak.remote` untracked, không khớp pattern `.env`** → `git add -A` sẽ nuốt vào repo. Đã siết `.gitignore`: `.env.*` + whitelist `.env.example`, `.env.production`. Đã verify file này giờ bị ignore.

**2. `.env.production` ĐANG được track trong git** (pre-existing). Kiểm tra: chỉ chứa `NEXT_PUBLIC_API_URL` + `BACKEND_URL`, **0 dòng dạng secret** → an toàn, giữ nguyên trong whitelist.

⚠️ **Ngoài repo — cần hành động:** trong phiên làm việc này, lệnh đọc `~/.npmrc` (để chẩn đoán lỗi npm 530) đã in 3 auth token thật ra transcript: npmjs, GitHub Packages (`gho_...`), và cpm.playablelabs.ai (JWT, hết hạn ~04/2027). **Nên thu hồi và tạo lại cả ba.** Không token nào lọt vào git — commit đã scan sạch.

## Câu hỏi chưa giải quyết

1. Biến `result` dead ở `quiz-lesson-content.tsx:69` — xóa hẳn hay giữ? (chưa đụng)
2. `npm audit` báo 25 lỗ hổng (14 high, 1 critical) — pre-existing, chưa đụng. Cần xử lý riêng.
3. E2E đăng nhập thật cần `E2E_EMAIL`/`E2E_PASSWORD`; chưa có tài khoản test nên phần đó tự skip. E2E chưa chạy thật lần nào (mới verify `--list` nhận đủ 7 test) vì cần dev server + backend.
4. 3 token trong `~/.npmrc` cần thu hồi — xem § Bảo mật.
