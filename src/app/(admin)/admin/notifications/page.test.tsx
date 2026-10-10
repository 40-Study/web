/**
 * /admin/notifications — thông báo hệ thống (contract C3). Hook + service THẬT, chỉ api-client (mockApi) và toast bị giả:
 * xem trước sống theo đối tượng, hộp xác nhận "Gửi tới N người?", khoá nút khi đang gửi, và số người đã nhận khi lỗi giữa chừng.
 */

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { toast } from "sonner";
import { RateLimitError } from "@/lib/errors";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import AdminBroadcastNotificationsPage from "./page";

const PREVIEW_URL = "/admin/notifications/broadcast/preview";
const SEND_URL = "/admin/notifications/broadcast";

function setupApi(opts: { previewCount?: number | ((body: { roles?: string[] }) => number) } = {}) {
  const previewCount = opts.previewCount ?? 123;
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/system-roles") {
      return {
        data: {
          message: "ok",
          data: { roles: [{ id: "r1", name: "STUDENT" }, { id: "r2", name: "TEACHER" }] },
        },
      };
    }
    throw new Error(`unexpected GET ${url}`);
  });
  mockApi.post.mockImplementation(async (url: string, body: { roles?: string[] }) => {
    if (url === PREVIEW_URL) {
      const n = typeof previewCount === "function" ? previewCount(body) : previewCount;
      return { status: 200, data: { message: "success", data: { recipient_count: n } } };
    }
    return {
      status: 201,
      data: {
        message: "Đã gửi thông báo",
        data: { recipient_count: 123, audience: "all", roles: [], notification_type: "system" },
      },
    };
  });
}

const sendCalls = () => mockApi.post.mock.calls.filter(([url]) => url === SEND_URL);

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Tiêu đề"), "  Bảo trì hệ thống  ");
  await user.type(screen.getByLabelText("Nội dung"), "Hệ thống bảo trì lúc 22h");
}

const submitButton = () => screen.getByRole("button", { name: "Gửi thông báo" });

beforeEach(() => {
  resetMockApi();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

describe("AdminBroadcastNotificationsPage", () => {
  it("đếm người nhận ngay khi mở trang (audience=all) và chỉ cho gửi khi đủ tiêu đề + nội dung", async () => {
    setupApi();
    const user = userEvent.setup();
    renderWithProviders(<AdminBroadcastNotificationsPage />);

    expect(await screen.findByText("Sẽ gửi tới 123 người.")).toBeTruthy();
    expect(mockApi.post).toHaveBeenCalledWith(PREVIEW_URL, { audience: "all", roles: undefined, notification_type: "system" });
    expect((submitButton() as HTMLButtonElement).disabled).toBe(true); // chưa nhập gì

    await fillForm(user);
    expect((submitButton() as HTMLButtonElement).disabled).toBe(false);
  });

  it("audience=roles: chưa chọn vai trò thì không đếm và không gửi được; chọn rồi đếm theo vai trò đó", async () => {
    setupApi({ previewCount: (b) => (b.roles?.includes("STUDENT") ? 40 : 7) });
    const user = userEvent.setup();
    renderWithProviders(<AdminBroadcastNotificationsPage />);
    await fillForm(user);

    await user.click(screen.getByLabelText("Theo vai trò"));
    expect(await screen.findByText("Chọn ít nhất một vai trò để xem số người nhận.")).toBeTruthy();
    expect((submitButton() as HTMLButtonElement).disabled).toBe(true);
    // audience=roles mà chưa chọn vai trò: không gọi preview (backend sẽ 400 VALIDATION_FAILED)
    expect(mockApi.post.mock.calls.filter(([url, b]) => url === PREVIEW_URL && b.audience === "roles")).toHaveLength(0);

    await user.click(await screen.findByLabelText("STUDENT"));
    expect(await screen.findByText("Sẽ gửi tới 40 người.")).toBeTruthy();
    expect(mockApi.post).toHaveBeenCalledWith(PREVIEW_URL, { audience: "roles", roles: ["STUDENT"], notification_type: "system" });
    expect((submitButton() as HTMLButtonElement).disabled).toBe(false);

    await user.click(screen.getByLabelText("STUDENT")); // bỏ chọn -> lại không gửi được
    expect(await screen.findByText("Chọn ít nhất một vai trò để xem số người nhận.")).toBeTruthy();
    expect((submitButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it("0 người nhận: hiện thông báo và khoá nút gửi", async () => {
    setupApi({ previewCount: 0 });
    const user = userEvent.setup();
    renderWithProviders(<AdminBroadcastNotificationsPage />);
    await fillForm(user);

    expect(await screen.findByText("Không có người nhận nào phù hợp.")).toBeTruthy();
    expect((submitButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it("gửi qua hộp xác nhận 'Gửi tới N người?', body đã trim, toast nêu số người, form được xoá", async () => {
    setupApi();
    const user = userEvent.setup();
    renderWithProviders(<AdminBroadcastNotificationsPage />);
    await screen.findByText("Sẽ gửi tới 123 người.");
    await fillForm(user);
    await user.selectOptions(screen.getByLabelText("Loại thông báo"), "promotion");

    await user.click(submitButton());
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Gửi tới 123 người?")).toBeTruthy();
    expect(within(dialog).getByText(/không thể thu hồi/)).toBeTruthy();
    expect(sendCalls()).toHaveLength(0); // chưa xác nhận thì chưa gửi

    await user.click(within(dialog).getByRole("button", { name: "Gửi thông báo" }));

    await waitFor(() => expect(sendCalls()).toHaveLength(1));
    expect(sendCalls()[0][1]).toEqual({
      title: "Bảo trì hệ thống",
      content: "Hệ thống bảo trì lúc 22h",
      audience: "all",
      roles: undefined,
      notification_type: "promotion",
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Đã gửi thông báo tới 123 người"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect((screen.getByLabelText("Tiêu đề") as HTMLInputElement).value).toBe("");
  });

  it("đang gửi: nút xác nhận bị khoá, bấm lại không gửi lần hai", async () => {
    setupApi();
    let resolveSend: (v: unknown) => void = () => {};
    const base = mockApi.post.getMockImplementation()!;
    mockApi.post.mockImplementation((url: string, body: unknown) =>
      url === SEND_URL ? new Promise((r) => (resolveSend = r)) : base(url, body)
    );
    const user = userEvent.setup();
    renderWithProviders(<AdminBroadcastNotificationsPage />);
    await screen.findByText("Sẽ gửi tới 123 người.");
    await fillForm(user);
    await user.click(submitButton());
    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Gửi thông báo" }) as HTMLButtonElement;

    await user.click(confirm);
    await waitFor(() => expect(confirm.disabled).toBe(true));
    await user.dblClick(confirm); // nút đã khoá: không thêm request nào
    expect(sendCalls()).toHaveLength(1);

    resolveSend({ status: 201, data: { message: "ok", data: { recipient_count: 123, audience: "all", roles: [], notification_type: "system" } } });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(sendCalls()).toHaveLength(1);
  });

  it("lỗi giữa chừng (500 BROADCAST_PARTIAL): toast nêu số người ĐÃ nhận, form được giữ nguyên", async () => {
    setupApi();
    const base = mockApi.post.getMockImplementation()!;
    mockApi.post.mockImplementation(async (url: string, body: unknown, config?: unknown) =>
      url === SEND_URL
        ? { status: 500, data: { message: "Gửi thông báo bị gián đoạn", code: "BROADCAST_PARTIAL", delivered: 500 } }
        : base(url, body, config)
    );
    const user = userEvent.setup();
    renderWithProviders(<AdminBroadcastNotificationsPage />);
    await screen.findByText("Sẽ gửi tới 123 người.");
    await fillForm(user);
    await user.click(submitButton());
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Gửi thông báo" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    const [title, opts] = vi.mocked(toast.error).mock.calls[0] as [string, { description: string }];
    expect(title).toBe("Gửi thông báo thất bại");
    expect(opts.description).toContain("500 người đã nhận");
    expect(opts.description).toContain("Không gửi lại toàn bộ");
    expect(toast.success).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Tiêu đề") as HTMLInputElement).value).toBe("  Bảo trì hệ thống  ");
  });

  it("500 thường (không phải partial): không lộ nội dung body, và 4xx vẫn đi qua interceptor (validateStatus chỉ cho 2xx + 500)", async () => {
    setupApi();
    const base = mockApi.post.getMockImplementation()!;
    mockApi.post.mockImplementation(async (url: string, body: unknown, config?: unknown) =>
      url === SEND_URL
        ? { status: 500, data: { message: "pq: connection refused", code: "INTERNAL_ERROR" } }
        : base(url, body, config)
    );
    const user = userEvent.setup();
    renderWithProviders(<AdminBroadcastNotificationsPage />);
    await screen.findByText("Sẽ gửi tới 123 người.");
    await fillForm(user);
    await user.click(submitButton());
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Gửi thông báo" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    const opts = vi.mocked(toast.error).mock.calls[0][1] as { description: string };
    expect(opts.description).not.toContain("pq:");

    const validateStatus = (sendCalls()[0][2] as { validateStatus: (s: number) => boolean }).validateStatus;
    expect([200, 201, 500].every(validateStatus)).toBe(true);
    expect([400, 401, 403, 422, 429].some(validateStatus)).toBe(false);
  });

  it("429: thông báo nêu hạn mức 5/giờ và thời gian chờ đã quy đổi", async () => {
    setupApi();
    const base = mockApi.post.getMockImplementation()!;
    mockApi.post.mockImplementation(async (url: string, body: unknown, config?: unknown) => {
      if (url === SEND_URL) throw new RateLimitError(3500);
      return base(url, body, config);
    });
    const user = userEvent.setup();
    renderWithProviders(<AdminBroadcastNotificationsPage />);
    await screen.findByText("Sẽ gửi tới 123 người.");
    await fillForm(user);
    await user.click(submitButton());
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Gửi thông báo" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    const opts = vi.mocked(toast.error).mock.calls[0][1] as { description: string };
    expect(opts.description).toBe("Bạn đã gửi tối đa 5 thông báo hệ thống trong 1 giờ. Vui lòng thử lại sau 59 phút.");
  });
  // ─── M2 (QA 261009): gửi đồng bộ trong request; web hết 15s -> admin gửi lại -> trùng thông báo ────────

  const sendConfig = (i: number) =>
    sendCalls()[i][2] as { headers?: Record<string, string>; timeout?: number } | undefined;
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  async function confirmSend(user: ReturnType<typeof userEvent.setup>) {
    await user.click(submitButton());
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Gửi thông báo" }));
  }

  it("M2: request gửi mang header Idempotency-Key (UUID) và timeout dài hơn mặc định 15s của api-client", async () => {
    setupApi();
    const user = userEvent.setup();
    renderWithProviders(<AdminBroadcastNotificationsPage />);
    await screen.findByText("Sẽ gửi tới 123 người.");
    await fillForm(user);
    await confirmSend(user);

    await waitFor(() => expect(sendCalls()).toHaveLength(1));
    expect(sendConfig(0)?.headers?.["Idempotency-Key"]).toMatch(UUID);
    expect(sendConfig(0)?.timeout).toBeGreaterThanOrEqual(120_000);
  });

  it("M2: gửi lại CÙNG nội dung sau khi lỗi (timeout/5xx) dùng lại key cũ; gửi đợt mới sau khi thành công dùng key mới", async () => {
    setupApi();
    const base = mockApi.post.getMockImplementation()!;
    let failNext = true;
    mockApi.post.mockImplementation(async (url: string, body: unknown, config?: unknown) => {
      if (url === SEND_URL && failNext) {
        failNext = false;
        throw new Error("timeout of 120000ms exceeded");
      }
      return base(url, body, config);
    });
    const user = userEvent.setup();
    renderWithProviders(<AdminBroadcastNotificationsPage />);
    await screen.findByText("Sẽ gửi tới 123 người.");
    await fillForm(user);

    await confirmSend(user);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await confirmSend(user); // cùng nội dung, bấm gửi lại
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(sendCalls()).toHaveLength(2);
    expect(sendConfig(1)?.headers?.["Idempotency-Key"]).toBe(sendConfig(0)?.headers?.["Idempotency-Key"]);

    // Thành công rồi: đợt mới (form đã xoá, nhập nội dung mới) là một lần gửi khác -> key khác.
    await fillForm(user);
    await confirmSend(user);
    await waitFor(() => expect(sendCalls()).toHaveLength(3));
    const k = [0, 1, 2].map((i) => sendConfig(i)?.headers?.["Idempotency-Key"]);
    expect(k[2]).toMatch(UUID);
    expect(k[2]).not.toBe(k[0]);
  });

  it("M2: sửa nội dung giữa hai lần gửi là một lần gửi khác -> key mới (key cũ không được dùng cho nội dung khác)", async () => {
    setupApi();
    const base = mockApi.post.getMockImplementation()!;
    let failNext = true;
    mockApi.post.mockImplementation(async (url: string, body: unknown, config?: unknown) => {
      if (url === SEND_URL && failNext) {
        failNext = false;
        throw new Error("timeout of 120000ms exceeded");
      }
      return base(url, body, config);
    });
    const user = userEvent.setup();
    renderWithProviders(<AdminBroadcastNotificationsPage />);
    await screen.findByText("Sẽ gửi tới 123 người.");
    await fillForm(user);
    await confirmSend(user);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await user.type(screen.getByLabelText("Tiêu đề"), " (đã sửa)");
    await confirmSend(user);
    await waitFor(() => expect(sendCalls()).toHaveLength(2));
    expect(sendConfig(1)?.headers?.["Idempotency-Key"]).not.toBe(sendConfig(0)?.headers?.["Idempotency-Key"]);
  });

  // ─── M3 (QA 261009): backend loại người đã tắt khuyến mãi khỏi số người nhận ───────────────────────

  it("M3: chọn loại 'Khuyến mãi' hiện gợi ý người tắt khuyến mãi bị loại khỏi số người nhận; 'Hệ thống' thì không", async () => {
    setupApi();
    const user = userEvent.setup();
    renderWithProviders(<AdminBroadcastNotificationsPage />);
    await screen.findByText("Sẽ gửi tới 123 người.");

    const hint = /đã tắt nhận thông báo khuyến mãi/i;
    expect(screen.queryByText(hint)).toBeNull();

    await user.selectOptions(screen.getByLabelText("Loại thông báo"), "promotion");
    expect(screen.getByText(hint)).toBeTruthy();

    await user.selectOptions(screen.getByLabelText("Loại thông báo"), "system");
    expect(screen.queryByText(hint)).toBeNull();
  });

  it("M3: số người nhận được đếm lại theo loại — preview gửi notification_type để số khớp loại sẽ gửi", async () => {
    setupApi({ previewCount: (b) => ((b as { notification_type?: string }).notification_type === "promotion" ? 80 : 123) });
    const user = userEvent.setup();
    renderWithProviders(<AdminBroadcastNotificationsPage />);
    expect(await screen.findByText("Sẽ gửi tới 123 người.")).toBeTruthy();

    await user.selectOptions(screen.getByLabelText("Loại thông báo"), "promotion");
    expect(await screen.findByText("Sẽ gửi tới 80 người.")).toBeTruthy();
    expect(mockApi.post).toHaveBeenCalledWith(PREVIEW_URL, { audience: "all", roles: undefined, notification_type: "promotion" });
  });

  it("M2: server từ chối bằng 4xx (429) -> chưa gửi gì, lần gửi lại là lần gửi mới với key mới", async () => {
    setupApi();
    const base = mockApi.post.getMockImplementation()!;
    let rejectNext = true;
    mockApi.post.mockImplementation(async (url: string, body: unknown, config?: unknown) => {
      if (url === SEND_URL && rejectNext) {
        rejectNext = false;
        throw new RateLimitError(3500);
      }
      return base(url, body, config);
    });
    const user = userEvent.setup();
    renderWithProviders(<AdminBroadcastNotificationsPage />);
    await screen.findByText("Sẽ gửi tới 123 người.");
    await fillForm(user);
    await confirmSend(user);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await confirmSend(user);
    await waitFor(() => expect(sendCalls()).toHaveLength(2));
    expect(sendConfig(1)?.headers?.["Idempotency-Key"]).not.toBe(sendConfig(0)?.headers?.["Idempotency-Key"]);
  });
});
