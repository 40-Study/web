/**
 * Q5-T11: "Ngôn ngữ *" bắt buộc cho MỌI loại bài kể cả "Bài tập về nhà" (không có trình chấm code), và câu hướng dẫn
 * chọn buổi nói "cột giữa" trong khi buổi học nằm ở trên (mobile) hoặc cột phải (1280px). Test ĐỎ nếu ngôn ngữ lại
 * bắt buộc với bài không phải lập trình, hoặc nếu bài lập trình thôi bắt buộc ngôn ngữ.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { createContext, useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createMutate = vi.fn();

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("@/stores/auth.store", () => ({ useAuthStore: () => ({ user: { id: "t1" } }) }));
vi.mock("@/hooks/queries/use-courses", () => ({
  useMyCourses: () => ({ data: [{ id: "c1", title: "Khoá 1", status: "published", isPublished: true }], isLoading: false }),
}));
vi.mock("@/hooks/queries/use-livestream-v2", () => ({
  useTeacherLivestreamsForCourse: () => ({ data: [{ id: "s1", title: "Buổi 1", status: "scheduled" }], isLoading: false }),
}));
vi.mock("@/hooks/queries/use-assignments", () => ({
  useAssignmentsBySession: () => ({ data: undefined, isLoading: false, isError: false }),
  useCreateAssignment: () => ({ mutate: createMutate, isPending: false }),
  usePublishAssignment: () => ({ mutate: vi.fn(), isPending: false }),
  useUnpublishAssignment: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteAssignment: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/components/editor", () => ({
  TiptapEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="Yêu cầu chi tiết" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));
// Radix Select không chạy ổn trong jsdom: thay bằng danh sách nút gọi onValueChange.
vi.mock("@/components/ui/select", () => {
  const Ctx = createContext<(v: string) => void>(() => undefined);
  return {
    Select: ({ onValueChange, children }: { onValueChange: (v: string) => void; children: React.ReactNode }) => (
      <Ctx.Provider value={onValueChange}>{children}</Ctx.Provider>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectValue: () => null,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => {
      const onValueChange = useContext(Ctx);
      return <button type="button" onClick={() => onValueChange(value)}>{children}</button>;
    },
  };
});

// eslint-disable-next-line import/first
import TeacherAssignmentsPage from "./page";

const createButton = () => screen.getByRole("button", { name: /Tạo bài tập cho buổi học này/ }) as HTMLButtonElement;

function fillSession() {
  render(<TeacherAssignmentsPage />);
  fireEvent.click(screen.getByRole("button", { name: /Buổi 1/ }));
  fireEvent.change(screen.getByLabelText("Tên bài tập *"), { target: { value: "Bài QA5" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Yêu cầu chi tiết" }), { target: { value: "Làm đủ" } });
}

describe("/teacher/assignments — ngôn ngữ chỉ bắt buộc với bài lập trình (Q5-T11)", () => {
  beforeEach(() => createMutate.mockReset());

  it("chưa chọn buổi: câu hướng dẫn không còn nói 'cột giữa'", () => {
    render(<TeacherAssignmentsPage />);
    expect(screen.getByText("Chọn một buổi học ở phía trên để xem bài tập.")).toBeTruthy();
    expect(screen.queryByText(/cột giữa/)).toBeNull();
  });

  it("bài lập trình (mặc định): nhãn có dấu *, bỏ trống ngôn ngữ thì không tạo được", () => {
    fillSession();
    fireEvent.change(screen.getByLabelText(/Ngôn ngữ/), { target: { value: "" } });

    expect(screen.getByText("Ngôn ngữ (phân cách bởi dấu phẩy) *")).toBeTruthy();
    expect(createButton().disabled).toBe(true);
  });

  it("bài tập về nhà: ngôn ngữ không bắt buộc, bỏ trống vẫn tạo được và gửi language rỗng", () => {
    fillSession();
    fireEvent.click(screen.getByRole("button", { name: "Bài tập về nhà" }));
    fireEvent.change(screen.getByLabelText(/Ngôn ngữ/), { target: { value: "" } });

    expect(screen.getByText(/Ngôn ngữ \(không bắt buộc/)).toBeTruthy();
    expect(createButton().disabled).toBe(false);

    fireEvent.click(createButton());
    expect(createMutate).toHaveBeenCalledTimes(1);
    expect(createMutate.mock.calls[0][0].dto).toMatchObject({ type: "homework", language: [] });
  });

  it("đổi về bài lập trình: ngôn ngữ bắt buộc trở lại", () => {
    fillSession();
    fireEvent.click(screen.getByRole("button", { name: "Bài tập về nhà" }));
    fireEvent.change(screen.getByLabelText(/Ngôn ngữ/), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Lập trình trực tiếp" }));

    expect(createButton().disabled).toBe(true);
  });
});
