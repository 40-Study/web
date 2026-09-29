/**
 * E2E — quản lý cuộc thi (lane W2): giảng viên tạo quiz + cuộc thi, gửi duyệt, bị từ chối rồi sửa và
 * gửi lại; admin duyệt kèm giải voucher, huỷ một cuộc thi khác, chốt kết quả sau khi kết thúc.
 * Kiểm cả: giảng viên không có nút chốt; lỗi 403/404/409 hiện tiếng Việt; không tràn ngang ở 390px.
 *
 * Học viên đăng ký/làm bài qua API (`context.request`, đi qua proxy /api của Next) vì UI thí sinh
 * thuộc lane W1. Cuộc thi dùng lịch ngắn (bắt đầu sau ~3 phút, làm 1 phút, kết thúc sau 2 phút) để
 * chốt được trong một lần chạy, nên test dài ~7 phút.
 *
 * Chỉ chạy khi có đủ env (không hardcode credential):
 *   E2E_PASSWORD, E2E_TEACHER_EMAIL, E2E_TEACHER2_EMAIL, E2E_ADMIN_EMAIL, E2E_STUDENT_EMAIL
 * Backend phải là bản có API cuộc thi (backend PR #80 + #82); khi chạy dev server riêng nhớ đặt
 * BACKEND_URL để proxy /api trỏ đúng backend đó.
 */

import { expect, test, type APIRequestContext, type Browser, type BrowserContext, type Page } from "@playwright/test";

const PASSWORD = process.env.E2E_PASSWORD;
const TEACHER = process.env.E2E_TEACHER_EMAIL;
const TEACHER2 = process.env.E2E_TEACHER2_EMAIL;
const ADMIN = process.env.E2E_ADMIN_EMAIL;
const STUDENT = process.env.E2E_STUDENT_EMAIL;
const RUN_ID = Date.now().toString(36);

test.describe.configure({ mode: "serial" });
test.skip(
  !PASSWORD || !TEACHER || !TEACHER2 || !ADMIN || !STUDENT,
  "Cần E2E_PASSWORD + E2E_{TEACHER,TEACHER2,ADMIN,STUDENT}_EMAIL để chạy test cuộc thi"
);

/** "YYYY-MM-DDTHH:mm" theo giờ máy (cùng múi giờ với trình duyệt Playwright). */
function localInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function login(browser: Browser, email: string): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD!);
  await page.locator('button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login(\?|$)/, { timeout: 30_000 });
  return { context, page };
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

async function toast(page: Page, text: RegExp) {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: text }).first()).toBeVisible({ timeout: 15_000 });
}

async function apiJson(request: APIRequestContext, method: "get" | "post" | "put" | "delete", url: string, data?: unknown) {
  const res = await request[method](url, data === undefined ? undefined : { data });
  return { status: res.status(), body: await res.json().catch(() => null) };
}

/** Tạo quiz 1 câu qua trình tạo nhanh rồi điền form cuộc thi; trả id cuộc thi sau khi lưu nháp. */
async function createContestViaUi(page: Page, title: string, start: Date, end: Date): Promise<string> {
  await page.goto("/teacher/contests/create");
  await page.getByTestId("open-quiz-builder").click();
  await page.locator("#quiz-title").fill(`QA-contest quiz ${title}`);
  await page.getByLabel("Nội dung câu 1").fill("2 + 2 = ?");
  await page.getByLabel("Câu 1 đáp án 1", { exact: true }).fill("4");
  await page.getByLabel("Câu 1 đáp án 2", { exact: true }).fill("5");
  await page.getByTestId("quiz-builder-save").click();
  await expect(page.getByTestId("quiz-builder")).toBeHidden({ timeout: 15_000 });
  await expect(page.getByTestId("quiz-select")).not.toHaveValue("");

  await page.locator("#contest-title").fill(title);
  await page.locator("#contest-start").fill(localInput(start));
  await page.locator("#contest-end").fill(localInput(end));
  await page.locator("#contest-duration").fill("1");
  await page.getByRole("button", { name: "Thêm giải" }).click();
  // Form giảng viên KHÔNG có ô voucher.
  await expect(page.getByTestId("prize-voucher-0")).toHaveCount(0);
  await page.getByTestId("contest-form-submit").click();
  await page.waitForURL(/\/teacher\/contests\/[0-9a-f-]{36}$/, { timeout: 20_000 });
  return page.url().split("/").pop()!;
}

test("vòng đời cuộc thi: giảng viên ↔ admin, lỗi tiếng Việt, chốt kết quả", async ({ browser }) => {
  test.setTimeout(12 * 60_000);

  // Lịch ngắn theo phút tròn (datetime-local chỉ tới phút).
  const base = new Date();
  base.setSeconds(0, 0);
  const start = new Date(base.getTime() + 3 * 60_000);
  const end = new Date(start.getTime() + 2 * 60_000);

  const teacher = await login(browser, TEACHER!);
  const titleA = `QA-contest A ${RUN_ID}`;
  const idA = await createContestViaUi(teacher.page, titleA, start, end);
  await expect(teacher.page.getByTestId("contest-phase")).toHaveText("Bản nháp");

  // Gửi duyệt → hết nút sửa/gửi, không có nút chốt.
  await teacher.page.getByTestId("submit-review").click();
  await teacher.page.getByTestId("approve-confirm").click();
  await toast(teacher.page, /Đã gửi cuộc thi/);
  await expect(teacher.page.getByTestId("contest-phase")).toHaveText("Chờ duyệt");
  await expect(teacher.page.getByTestId("submit-review")).toHaveCount(0);
  await expect(teacher.page.getByRole("button", { name: /chốt/i })).toHaveCount(0);

  // 404 tiếng Việt: giảng viên khác mở bản quản lý.
  const teacher2 = await login(browser, TEACHER2!);
  await teacher2.page.goto(`/teacher/contests/${idA}`);
  await expect(teacher2.page.getByText(/Không tìm thấy cuộc thi/)).toBeVisible({ timeout: 15_000 });
  // 403 tiếng Việt: giảng viên khác sửa/xoá/gửi duyệt.
  const del = await apiJson(teacher2.context.request, "delete", `/api/contests/${idA}`);
  expect(del.status).toBe(403);
  expect(del.body?.code).toBe("CONTEST_FORBIDDEN");
  expect(del.body?.message).toMatch(/không có quyền/);
  const sub = await apiJson(teacher2.context.request, "post", `/api/contests/${idA}/submit-review`);
  expect(sub.status).toBe(403);

  // Admin: menu có "Cuộc thi", tab chờ duyệt có cuộc thi A, từ chối có lý do.
  const admin = await login(browser, ADMIN!);
  await admin.page.goto("/admin/contests");
  await expect(admin.page.getByRole("navigation", { name: "Menu quản trị" }).getByRole("link", { name: /Cuộc thi/ })).toBeVisible();
  await expect(admin.page.getByTestId(`admin-contest-${idA}`)).toBeVisible({ timeout: 15_000 });
  await admin.page.goto(`/admin/contests/${idA}`);
  await admin.page.getByTestId("reject-contest").click();
  await admin.page.getByTestId("reason-input").fill("QA-contest: cần thêm mô tả");
  await admin.page.getByTestId("reason-submit").click();
  await toast(admin.page, /Đã từ chối/);

  // Giảng viên thấy lý do, sửa rồi gửi lại.
  await teacher.page.goto(`/teacher/contests/${idA}`);
  await expect(teacher.page.getByTestId("reject-reason")).toContainText("cần thêm mô tả");
  await teacher.page.locator("#contest-description").fill("Mô tả bổ sung sau khi bị từ chối");
  await teacher.page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await toast(teacher.page, /Đã lưu thay đổi/);
  await teacher.page.getByTestId("submit-review").click();
  await teacher.page.getByTestId("approve-confirm").click();
  await expect(teacher.page.getByTestId("contest-phase")).toHaveText("Chờ duyệt");

  // Duyệt kèm giải voucher.
  await admin.page.goto(`/admin/contests/${idA}`);
  await admin.page.getByTestId("prize-voucher-0").selectOption({ index: 1 });
  await admin.page.getByTestId("approve-contest").click();
  await admin.page.getByTestId("approve-confirm").click();
  await toast(admin.page, /Đã duyệt/);
  await expect(admin.page.getByTestId("contest-phase")).toHaveText("Sắp diễn ra");
  await expect(admin.page.getByTestId("prize-list")).toContainText("voucher");

  // Cuộc thi B: gửi duyệt rồi admin huỷ có lý do; 409 khi thao tác trên trạng thái cũ.
  const titleB = `QA-contest B ${RUN_ID}`;
  const idB = await createContestViaUi(teacher.page, titleB, new Date(start.getTime() + 60 * 60_000), new Date(start.getTime() + 2 * 60 * 60_000));
  await teacher.page.getByTestId("submit-review").click();
  await teacher.page.getByTestId("approve-confirm").click();
  await expect(teacher.page.getByTestId("contest-phase")).toHaveText("Chờ duyệt");
  // Tab cũ mở trước khi huỷ — dùng để kiểm 409 hiện toast tiếng Việt trên UI.
  const staleTab = await admin.context.newPage();
  await staleTab.goto(`/admin/contests/${idB}`);
  await expect(staleTab.getByTestId("reject-contest")).toBeVisible({ timeout: 15_000 });
  await admin.page.goto(`/admin/contests/${idB}`);
  await admin.page.getByTestId("cancel-contest").click();
  await admin.page.getByTestId("reason-input").fill("QA-contest: trùng lịch");
  await admin.page.getByTestId("reason-submit").click();
  await toast(admin.page, /Đã huỷ cuộc thi/);
  await expect(admin.page.getByTestId("cancel-reason")).toContainText("trùng lịch");
  await staleTab.getByTestId("reject-contest").click();
  await staleTab.getByTestId("reason-input").fill("QA-contest: muộn");
  await staleTab.getByTestId("reason-submit").click();
  await toast(staleTab, /Trạng thái cuộc thi đã thay đổi/);
  await staleTab.close();

  // 409 CONTEST_QUIZ_LOCKED: quiz của cuộc thi đã công bố không sửa được.
  const manageA = await apiJson(teacher.context.request, "get", `/api/contests/manage/${idA}`);
  const quizId = manageA.body?.data?.quiz?.id as string;
  const lock = await apiJson(teacher.context.request, "put", `/api/quizzes/${quizId}`, { title: "QA-contest sửa đề" });
  expect(lock.status).toBe(409);
  expect(lock.body?.code).toBe("CONTEST_QUIZ_LOCKED");

  // Học viên: đăng ký, đợi tới giờ, làm và nộp (API — UI thí sinh thuộc lane W1).
  const student = await login(browser, STUDENT!);
  const join = await apiJson(student.context.request, "post", `/api/contests/${idA}/join`);
  expect(join.status).toBe(201);
  await student.page.waitForTimeout(Math.max(0, start.getTime() - Date.now()) + 2_000);
  const started = await apiJson(student.context.request, "post", `/api/contests/${idA}/start`);
  expect(started.status).toBe(200);
  const q = started.body.data.questions[0];
  const correct = q.answers.find((a: { answer_text: string }) => a.answer_text === "4");
  const submitted = await apiJson(student.context.request, "post", `/api/contests/${idA}/submit`, {
    attempt_id: started.body.data.attempt_id,
    answers: [{ question_id: q.id, selected_answer_ids: [correct.id] }],
  });
  expect(submitted.status).toBe(200);

  // Trước end + 60s: nút chốt khoá; API trả 409 CONTEST_NOT_ENDED.
  await admin.page.waitForTimeout(Math.max(0, end.getTime() - Date.now()) + 3_000);
  await admin.page.goto(`/admin/contests/${idA}`);
  await expect(admin.page.getByTestId("finalize-contest")).toBeDisabled();
  await expect(admin.page.getByTestId("finalize-wait")).toBeVisible();
  const notEnded = await apiJson(admin.context.request, "post", `/api/admin/contests/${idA}/finalize`);
  expect(notEnded.status).toBe(409);
  expect(notEnded.body?.code).toBe("CONTEST_NOT_ENDED");

  // Giảng viên: cuộc thi đã kết thúc, vẫn KHÔNG có nút chốt.
  await teacher.page.goto(`/teacher/contests/${idA}`);
  await expect(teacher.page.getByTestId("await-finalize-note")).toBeVisible();
  await expect(teacher.page.getByRole("button", { name: /chốt/i })).toHaveCount(0);

  // Sau end + 60s: nút tự mở (đồng hồ 5s) → chốt.
  await expect(admin.page.getByTestId("finalize-contest")).toBeEnabled({ timeout: 90_000 });
  await admin.page.getByTestId("finalize-contest").click();
  await admin.page.getByTestId("approve-confirm").click();
  await toast(admin.page, /Đã chốt kết quả/);
  await expect(admin.page.getByTestId("finalized-note")).toBeVisible();
  await expect(admin.page.getByTestId("participants-table")).toContainText("Đã nộp");
  const again = await apiJson(admin.context.request, "post", `/api/admin/contests/${idA}/finalize`);
  expect(again.status).toBe(200);
  expect(again.body?.data?.already_finalized).toBe(true);

  // Học viên nhận voucher giải (nguồn contest_reward).
  const mine = await apiJson(student.context.request, "get", "/api/vouchers/me");
  expect(JSON.stringify(mine.body)).toContain("contest_reward");

  // 390px: không tràn ngang ở các trang quản lý.
  for (const [page, url] of [
    [teacher.page, "/teacher/contests"],
    [teacher.page, `/teacher/contests/${idA}`],
    [teacher.page, "/teacher/contests/create"],
    [admin.page, "/admin/contests"],
    [admin.page, `/admin/contests/${idA}`],
  ] as const) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    await expectNoHorizontalOverflow(page);
  }

  for (const s of [teacher, teacher2, admin, student]) await s.context.close();
});
