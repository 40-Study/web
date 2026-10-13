/**
 * QA2 Q2-04 (smoke2 PARTIAL): điểm đạt (%) và số lần làm tối đa chỉ có ở form TẠO; nút bút chì trên hàng quiz
 * đã tạo chỉ sửa tiêu đề nên giá trị đã lưu không xem/sửa được. Editor này nạp quiz từ `GET /quizzes/:id`,
 * kiểm cùng luật với form tạo và báo lên cho hộp thoại sửa phần thay đổi để gửi `PUT /quizzes/:id`.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { QuizSettingsEditor, type QuizSettingsEditState } from "./quiz-settings-editor";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

function lastState(onChange: ReturnType<typeof vi.fn>): QuizSettingsEditState {
  return onChange.mock.calls[onChange.mock.calls.length - 1][0] as QuizSettingsEditState;
}

beforeEach(() => resetMockApi());

describe("QuizSettingsEditor", () => {
  it("nạp giá trị đang lưu từ API vào hai ô", async () => {
    mockApi.get.mockResolvedValue(envelope({ id: "q1", title: "Git", pass_percentage: 72.5, max_attempts: 4 }));
    renderWithProviders(<QuizSettingsEditor quizId="q1" onChange={vi.fn()} />);

    expect(await screen.findByDisplayValue("72.5")).toBeTruthy();
    expect((screen.getByLabelText("Số lần làm tối đa") as HTMLInputElement).value).toBe("4");
    expect(mockApi.get).toHaveBeenCalledWith("/quizzes/q1");
  });

  it("chưa sửa gì: không có gì để lưu và không chặn nút lưu", async () => {
    mockApi.get.mockResolvedValue(envelope({ id: "q1", title: "Git", pass_percentage: 70, max_attempts: 3 }));
    const onChange = vi.fn();
    renderWithProviders(<QuizSettingsEditor quizId="q1" onChange={onChange} />);
    await screen.findByDisplayValue("70");

    expect(lastState(onChange)).toEqual({ payload: null, blocked: false });
  });

  it("chỉ gửi trường đã đổi (PUT bỏ trường = giữ nguyên)", async () => {
    mockApi.get.mockResolvedValue(envelope({ id: "q1", title: "Git", pass_percentage: 70, max_attempts: 3 }));
    const onChange = vi.fn();
    renderWithProviders(<QuizSettingsEditor quizId="q1" onChange={onChange} />);
    await screen.findByDisplayValue("70");
    const pass = screen.getByLabelText("Điểm đạt (%)");

    fireEvent.change(pass, { target: { value: "85" } });
    expect(lastState(onChange)).toEqual({ payload: { pass_percentage: 85 }, blocked: false });

    fireEvent.change(screen.getByLabelText("Số lần làm tối đa"), { target: { value: "5" } });
    expect(lastState(onChange)).toEqual({ payload: { pass_percentage: 85, max_attempts: 5 }, blocked: false });
  });

  it("giá trị ngoài khoảng: hiện lỗi giống form tạo và chặn lưu", async () => {
    mockApi.get.mockResolvedValue(envelope({ id: "q1", title: "Git", pass_percentage: 70, max_attempts: 3 }));
    const onChange = vi.fn();
    renderWithProviders(<QuizSettingsEditor quizId="q1" onChange={onChange} />);
    await screen.findByDisplayValue("70");
    const pass = screen.getByLabelText("Điểm đạt (%)");

    fireEvent.change(pass, { target: { value: "150" } });
    expect(screen.getByText("Điểm đạt phải là số từ 0 đến 100 (%).")).toBeTruthy();
    expect(lastState(onChange)).toEqual({ payload: null, blocked: true });

    fireEvent.change(pass, { target: { value: "70" } });
    fireEvent.change(screen.getByLabelText("Số lần làm tối đa"), { target: { value: "0" } });
    expect(screen.getByText("Số lần làm tối đa phải là số nguyên từ 1 đến 100.")).toBeTruthy();
    expect(lastState(onChange).blocked).toBe(true);
  });

  it("quiz cũ chưa có max_attempts: ô trống, không bị chặn khi chỉ sửa điểm đạt", async () => {
    mockApi.get.mockResolvedValue(envelope({ id: "q1", title: "Git", pass_percentage: 60, max_attempts: null }));
    const onChange = vi.fn();
    renderWithProviders(<QuizSettingsEditor quizId="q1" onChange={onChange} />);
    await screen.findByDisplayValue("60");
    const pass = screen.getByLabelText("Điểm đạt (%)");
    expect((screen.getByLabelText("Số lần làm tối đa") as HTMLInputElement).value).toBe("");

    fireEvent.change(pass, { target: { value: "65" } });
    expect(lastState(onChange)).toEqual({ payload: { pass_percentage: 65 }, blocked: false });
  });

  it("không tải được quiz: báo lỗi, không chặn việc lưu tiêu đề", async () => {
    mockApi.get.mockRejectedValue(new Error("boom"));
    const onChange = vi.fn();
    renderWithProviders(<QuizSettingsEditor quizId="q1" onChange={onChange} />);

    await waitFor(() => expect(screen.getByText(/Không tải được cài đặt bài trắc nghiệm/)).toBeTruthy());
    expect(lastState(onChange)).toEqual({ payload: null, blocked: false });
  });
});
