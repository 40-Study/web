# Phase 02 — Hạ tầng test (Vitest + Playwright)

**Ưu tiên:** P0 | **Trạng thái:** chưa bắt đầu | **Phụ thuộc:** không

## Bối cảnh

Web hiện **không có bất kỳ test nào**: không `jest.config`, `vitest.config`, `playwright.config`, không thư mục `__tests__`/`tests`/`e2e`. `package.json` chỉ có `dev`, `build`, `start`, `lint`, `format`.

Đặt phase này trước phần feature để phase 03/04 ship kèm test luôn, thay vì nợ lại.

## Vì sao Vitest, không Jest

Next 14 + TypeScript + ESM: Vitest chạy thẳng qua Vite, không cần `babel-jest` hay `next/jest` transform chain. Nhanh hơn, config ngắn hơn, API tương thích Jest nên không phải học lại.

Playwright cho e2e vì đã cần test luồng nhiều bước (login → enroll → học) trên browser thật.

## Phạm vi test (giữ thực tế, không đuổi coverage %)

Ưu tiên đúng thứ tự này:

1. **Service layer** — thuần logic, dễ test nhất, giá trị cao nhất. Mock `api` client, assert URL + payload + shape trả về. Chính lớp này vừa để lọt bug contract ở phase 01.
2. **Query hooks** — render qua `QueryClientProvider` wrapper, assert loading/success/error.
3. **Component thuần** — component nhận props, không fetch.
4. **E2E** — 3 luồng xương sống: đăng nhập, xem/đăng ký khóa học, điểm danh (sau phase 03).

**Không** test: layout tĩnh, re-export barrel (`index.ts`), file config.

## Dependencies thêm

```
vitest @vitejs/plugin-react jsdom
@testing-library/react @testing-library/dom @testing-library/user-event
@playwright/test
```

Tất cả vào `devDependencies`.

## File liên quan

**Tạo:**
- `vitest.config.ts` — jsdom env, alias `@/` → `src/`, setup file
- `vitest.setup.ts` — import `@testing-library/react` cleanup, mock `next/navigation`
- `src/test/utils.tsx` — `renderWithProviders()` bọc QueryClientProvider (retry: false)
- `src/test/mock-api.ts` — helper mock `@/lib/api-client`
- `playwright.config.ts` — baseURL `http://localhost:3000`, `webServer` tự chạy `npm run dev`
- `e2e/auth.spec.ts` — luồng đăng nhập
- `e2e/courses.spec.ts` — xem danh sách + chi tiết khóa học
- `src/services/__tests__/certificate.service.test.ts` — chốt contract phase 01
- `src/services/__tests__/session.service.test.ts` — chốt endpoint attendance

**Sửa:**
- `package.json` — thêm script `test`, `test:watch`, `test:e2e`
- `tsconfig.json` — thêm `vitest/globals` vào `types` nếu dùng global API
- `.gitignore` — thêm `playwright-report/`, `test-results/`

## Các bước

1. Cài devDependencies.
2. Viết `vitest.config.ts` — **không chạm** `next.config.mjs`. Alias `@/` phải khớp `tsconfig.json` paths.
3. Viết `vitest.setup.ts`: mock `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`) vì hầu hết component dùng.
4. Viết `src/test/utils.tsx` với `renderWithProviders` — QueryClient `retry: false`, `gcTime: 0` để test không treo.
5. Viết `src/test/mock-api.ts` bọc `vi.mock("@/lib/api-client")`.
6. Viết test đầu tiên cho `certificate.service.ts` — assert đúng field phẳng của phase 01. Test này là cái chốt chống lặp lại bug contract.
7. Viết test cho `session.service.ts` — assert URL là `/sessions/:id/attendances`, **không** phải `/classes/:id/attendances`.
8. Thêm scripts vào `package.json`.
9. Cài Playwright browser: `npx playwright install chromium`.
10. Viết `playwright.config.ts` + 2 spec e2e cơ bản.
11. Chạy `npm run test` và `npm run test:e2e`, xác nhận xanh.

## Todo

- [ ] Cài devDependencies
- [ ] `vitest.config.ts` + `vitest.setup.ts`
- [ ] `src/test/utils.tsx` + `src/test/mock-api.ts`
- [ ] Test `certificate.service.ts` (chốt contract)
- [ ] Test `session.service.ts` (chốt endpoint canonical)
- [ ] Scripts trong `package.json`
- [ ] `playwright.config.ts` + `npx playwright install chromium`
- [ ] `e2e/auth.spec.ts` + `e2e/courses.spec.ts`
- [ ] `.gitignore` cho artifact test
- [ ] `npm run test` xanh, `npm run test:e2e` xanh

## Success criteria

- `npm run test` chạy được và xanh
- `npm run test:e2e` chạy được và xanh
- `npm run build` vẫn sạch (test infra không ảnh hưởng build)
- Test service dùng mock, **không** gọi backend thật
- E2E chạy trên dev server thật, không mock

## Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Alias `@/` không resolve trong Vitest | Copy chính xác `paths` từ `tsconfig.json` sang `resolve.alias` |
| Component dùng `next/navigation` crash trong jsdom | Mock sẵn trong `vitest.setup.ts` |
| E2E cần user thật để login | Dùng biến môi trường `E2E_EMAIL`/`E2E_PASSWORD`, skip test nếu thiếu — **không** hardcode credential |
| Playwright tải browser chậm lần đầu | Chỉ cài `chromium`, không cài cả 3 engine |
| Test treo do react-query retry | `retry: false` trong test QueryClient |

## Bảo mật

- Credential e2e đọc từ env, không commit. Thêm mẫu vào `.env.example` nếu file đó tồn tại.
- Không commit `playwright-report/`, `test-results/`.

## Bước tiếp

Phase 03 và 04 viết test kèm ngay khi thêm UI, dùng helper từ phase này.
