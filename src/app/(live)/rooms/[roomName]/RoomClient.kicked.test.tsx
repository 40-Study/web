import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Q5-T15 (L2): bị mời ra giữa buổi thì rời phòng về "khoá học của tôi". /my-courses là trang của học viên: giảng viên (vai
 * thật) bị guard (app)/layout đá lại kèm toast cảnh báo, nên đích của họ phải là /teacher/courses.
 */
const push = vi.hoisted(() => vi.fn());
const kicked = vi.hoisted(() => ({ fire: undefined as (() => void) | undefined }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("@/lib/meet/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/meet/api")>("@/lib/meet/api");
  return { ...actual, api: { get: vi.fn(async () => ({ data: [] })), post: vi.fn() } };
});
vi.mock("@/services/livestream.service", () => ({ livestreamService: {} }));
vi.mock("@/lib/meet/use-is-mobile", () => ({ useIsMobile: () => false }));
vi.mock("./tabs/VideoTab", () => ({
  default: ({ onKicked }: { onKicked?: () => void }) => {
    kicked.fire = onKicked;
    return null;
  },
}));
vi.mock("./tabs/WhiteboardTab", () => ({ default: () => null }));
vi.mock("./tabs/SandboxTab", () => ({ default: () => null }));
vi.mock("./tabs/ChatTab", () => ({ default: () => null }));
vi.mock("./tabs/ExercisePanel", () => ({ default: () => null }));
vi.mock("./tabs/AssignmentWorkOverlay", () => ({ default: () => null }));
vi.mock("./tabs/SharedBoardPanel", () => ({ default: () => null, StudentMiniBoard: () => null }));
vi.mock("./tabs/HostTools", () => {
  const Null = () => null;
  return {
    TimerModal: Null, MinimizedTimer: Null, RandomPickerModal: Null, HandRaisedNotification: Null,
    LeaveRequestNotification: Null, ShareRequestNotification: Null, ResponseNotification: Null,
  };
});

import RoomClient from "./RoomClient";

async function kickAs(activeRole: string, roles: Array<{ id: string; type: "system" | "organization"; role_name: string; display_name: string }> = []) {
  useAuthStore.setState({ activeRole, roles });
  render(<RoomClient sessionId="s1" token="t" serverUrl="wss://x" livekitRoomName="r" initialUser={{ id: "u1", name: "U" }} />);
  await waitFor(() => expect(kicked.fire).toBeDefined());
  kicked.fire?.();
}

describe("RoomClient — bị mời ra khỏi buổi học", () => {
  beforeEach(() => {
    push.mockClear();
    kicked.fire = undefined;
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ activeRole: null, roles: [] });
  });

  it("học viên về /my-courses", async () => {
    await kickAs("STUDENT");
    expect(push).toHaveBeenCalledWith("/my-courses");
  });

  it("giảng viên về /teacher/courses (không về trang học viên bị guard đá lại)", async () => {
    await kickAs("TEACHER");
    expect(push).toHaveBeenCalledWith("/teacher/courses");
  });

  it("vai tuỳ biến của tổ chức quy về giảng viên cũng về /teacher/courses", async () => {
    await kickAs("QA3_TEACHER", [
      { id: "sr-t", type: "system", role_name: "TEACHER", display_name: "TEACHER" },
      { id: "or-q", type: "organization", role_name: "QA3_TEACHER", display_name: "QA3_TEACHER" },
    ]);
    expect(push).toHaveBeenCalledWith("/teacher/courses");
  });
});
