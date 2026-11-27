/** QA7 S7-04: cuộc thi không có giải thì không in "Giải được trao…" ngay sau "không có giải thưởng". */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let detail: Record<string, unknown>;

vi.mock("next/navigation", () => ({ useParams: () => ({ slug: "demo" }) }));
vi.mock("@/stores/auth.store", () => ({ useAuthStore: () => ({ activeRole: "STUDENT" }) }));
vi.mock("@/hooks/queries/use-contests", () => ({
  useContestDetail: () => ({ data: detail, dataUpdatedAt: 0, isLoading: false, error: null, refetch: vi.fn() }),
}));
vi.mock("../_components/contest-leaderboard", () => ({ ContestLeaderboard: () => null }));
vi.mock("../_components/contest-cta-panel", () => ({ ContestCtaPanel: () => null }));
vi.mock("../_components/use-server-countdown", () => ({ useServerCountdown: () => null }));

// eslint-disable-next-line import/first
import ContestDetailPage from "./page";

beforeEach(() => {
  detail = {
    id: "c1",
    slug: "demo",
    title: "Cuộc thi demo",
    description: "",
    banner_url: null,
    type: "QUIZ",
    phase: "UPCOMING",
    start_time: "2026-12-02T12:00:00+07:00",
    end_time: "2026-12-02T13:08:00+07:00",
    server_time: "2026-11-25T12:00:00+07:00",
    duration_minutes: 30,
    question_count: 3,
    total_points: "3",
    max_participants: 0,
    participant_count: 0,
    creator_name: "GV",
    course: null,
    prizes: [],
    certificate_min_percentage: null,
    viewer: { my_participation: null },
  };
});

describe("ContestDetailPage — giải thưởng (S7-04)", () => {
  it("không có giải: chỉ 'Cuộc thi này không có giải thưởng', không có câu 'Giải được trao'", () => {
    render(<ContestDetailPage />);
    expect(screen.getByText("Cuộc thi này không có giải thưởng.")).toBeTruthy();
    expect(screen.queryByText(/Giải được trao/)).toBeNull();
  });

  it("có chứng nhận: vẫn có câu 'Giải được trao sau khi quản trị viên chốt kết quả'", () => {
    detail.certificate_min_percentage = "80";
    render(<ContestDetailPage />);
    expect(screen.queryByText("Cuộc thi này không có giải thưởng.")).toBeNull();
    expect(screen.getByText(/Giải được trao sau khi quản trị viên chốt kết quả/)).toBeTruthy();
  });
});

describe("ContestDetailPage — thông tin cuộc thi là danh sách định nghĩa hợp lệ (Q8-PG-10)", () => {
  it("dl > div > dt + dd, không có phần tử nào khác trong div (axe dlitem / definition-list)", () => {
    const { container } = render(<ContestDetailPage />);
    const list = container.querySelector("dl");
    expect(list).toBeTruthy();
    const groups = Array.from(list!.children);
    expect(groups.length).toBeGreaterThanOrEqual(4);
    for (const group of groups) {
      expect(group.tagName).toBe("DIV");
      expect(Array.from(group.children).map((c) => c.tagName)).toEqual(["DT", "DD"]);
    }
  });
});

describe("ContestDetailPage — landmark (Q9-PG-10)", () => {
  it("cột bên phải là complementary có tên (axe landmark-unique: khung ứng dụng đã có một aside không tên)", () => {
    render(<ContestDetailPage />);
    expect(screen.getByRole("complementary", { name: "Thông tin và đăng ký cuộc thi" })).toBeTruthy();
  });
});
