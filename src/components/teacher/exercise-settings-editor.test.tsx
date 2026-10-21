/**
 * QA ce-main-261021 F7/#2: bút chì trên bài code đã tạo phải cho sửa bộ test (kể cả test ẩn) và giới hạn
 * thời gian / bộ nhớ / điểm đạt, thay vì chỉ đổi tiêu đề.
 */

import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { ExerciseSettingsEditor, type ExerciseSettingsEditState } from "./exercise-settings-editor";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const EXERCISE = { id: "ex-1", title: "Tổng", time_limit: 2, memory_limit: 256, pass_percentage: 100 };
const TESTS = [
  { id: "t1", exercise_id: "ex-1", input: "1 2", expected_output: "3", is_hidden: false, display_order: 0 },
  { id: "t2", exercise_id: "ex-1", input: "5 5", expected_output: "10", is_hidden: true, display_order: 1 },
];

function lastState(onChange: ReturnType<typeof vi.fn>): ExerciseSettingsEditState {
  return onChange.mock.calls[onChange.mock.calls.length - 1][0] as ExerciseSettingsEditState;
}

async function renderEditor() {
  mockApi.get.mockImplementation(async (url: string) =>
    envelope(url.endsWith("/testcases") ? TESTS : EXERCISE),
  );
  const onChange = vi.fn();
  renderWithProviders(<ExerciseSettingsEditor exerciseId="ex-1" onChange={onChange} />);
  await screen.findByDisplayValue("5 5");
  return onChange;
}

beforeEach(() => resetMockApi());

describe("ExerciseSettingsEditor", () => {
  it("nạp giới hạn và MỌI test (kể cả test ẩn) từ API", async () => {
    await renderEditor();
    expect(mockApi.get).toHaveBeenCalledWith("/exercises/ex-1");
    expect(mockApi.get).toHaveBeenCalledWith("/exercises/ex-1/testcases");
    expect((screen.getByLabelText("Giới hạn thời gian (giây/test)") as HTMLInputElement).value).toBe("2");
    expect((screen.getByLabelText("Giới hạn bộ nhớ (MB)") as HTMLInputElement).value).toBe("256");
    expect((screen.getByLabelText("Điểm đạt (%)") as HTMLInputElement).value).toBe("100");
    expect((screen.getByLabelText("Đầu ra mong đợi test 2") as HTMLTextAreaElement).value).toBe("10");
    expect((screen.getByLabelText("Test ẩn 2") as HTMLInputElement).checked).toBe(true);
  });

  it("chưa sửa gì: không có gì để lưu, không chặn", async () => {
    const onChange = await renderEditor();
    expect(lastState(onChange)).toEqual({ plan: null, blocked: false });
  });

  it("sửa kết quả test ẩn + giới hạn thời gian -> kế hoạch PUT đúng phần đổi", async () => {
    const onChange = await renderEditor();
    fireEvent.change(screen.getByLabelText("Đầu ra mong đợi test 2"), { target: { value: "11" } });
    fireEvent.change(screen.getByLabelText("Giới hạn thời gian (giây/test)"), { target: { value: "4" } });

    expect(lastState(onChange)).toEqual({
      blocked: false,
      plan: {
        exerciseUpdate: { time_limit: 4 },
        updates: [{ id: "t2", body: { input: "5 5", expected_output: "11", is_hidden: true, display_order: 1 } }],
        creates: [],
        deletes: [],
      },
    });
  });

  it("thêm test mới và xoá test cũ", async () => {
    const onChange = await renderEditor();
    fireEvent.click(screen.getByRole("button", { name: /thêm test case/i }));
    fireEvent.change(screen.getByLabelText("Đầu vào test 3"), { target: { value: "0 0" } });
    fireEvent.change(screen.getByLabelText("Đầu ra mong đợi test 3"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Xoá test 2" }));

    const { plan } = lastState(onChange);
    expect(plan?.deletes).toEqual(["t2"]);
    expect(plan?.creates).toEqual([{ input: "0 0", expected_output: "0", is_hidden: false, display_order: 1 }]);
  });

  it("ẩn hết test công khai -> chặn lưu và nói rõ luật", async () => {
    const onChange = await renderEditor();
    fireEvent.click(screen.getByLabelText("Test ẩn 1"));
    expect(lastState(onChange)).toEqual({ plan: null, blocked: true });
    expect(screen.getByTestId("exercise-test-cases-error").textContent).toContain("ít nhất một test mẫu công khai");
  });

  it("xoá trắng đầu vào của test (backend trả 400 cho input rỗng) -> chặn lưu", async () => {
    const onChange = await renderEditor();
    fireEvent.change(screen.getByLabelText("Đầu vào test 1"), { target: { value: "" } });
    expect(lastState(onChange)).toEqual({ plan: null, blocked: true });
    expect(screen.getByTestId("exercise-test-cases-error").textContent).toContain("đầu vào");
  });

  it("bộ nhớ 1500 MB (trần backend) hợp lệ, 1501 thì chặn", async () => {
    const onChange = await renderEditor();
    fireEvent.change(screen.getByLabelText("Giới hạn bộ nhớ (MB)"), { target: { value: "1500" } });
    expect(lastState(onChange)).toMatchObject({ blocked: false, plan: { exerciseUpdate: { memory_limit: 1500 } } });
    fireEvent.change(screen.getByLabelText("Giới hạn bộ nhớ (MB)"), { target: { value: "1501" } });
    expect(lastState(onChange)).toEqual({ plan: null, blocked: true });
    expect(screen.getByText("Nhập số nguyên từ 16 đến 1500.")).toBeTruthy();
  });

  it("giới hạn ngoài khoảng -> chặn lưu, báo lỗi ngay dưới ô", async () => {
    const onChange = await renderEditor();
    fireEvent.change(screen.getByLabelText("Giới hạn thời gian (giây/test)"), { target: { value: "60" } });
    expect(lastState(onChange)).toEqual({ plan: null, blocked: true });
    expect(screen.getByText("Nhập số nguyên từ 1 đến 20.")).toBeTruthy();
  });

  it("không tải được: báo lỗi, không chặn sửa tiêu đề", async () => {
    mockApi.get.mockRejectedValue(new Error("500"));
    const onChange = vi.fn();
    renderWithProviders(<ExerciseSettingsEditor exerciseId="ex-1" onChange={onChange} />);
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(lastState(onChange)).toEqual({ plan: null, blocked: false });
  });
});
