import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StudioComposer } from "./studio-composer";
import { BUILTIN_SKILLS } from "@/lib/open-design/skills";
describe("AI chat composer", () => {
  it("a double click on Send does not cancel the request as the button changes to Stop", async () => {
    const sent = vi.fn();
    const cancelled = vi.fn();
    function Harness() {
      const [busy, setBusy] = useState(false);
      return (
        <StudioComposer
          prompt="Tạo slide"
          onPrompt={() => {}}
          documents={[]}
          onRemove={() => {}}
          onUpload={() => {}}
          skill={BUILTIN_SKILLS[0]}
          onSkills={() => {}}
          count={3}
          onCount={() => {}}
          busy={busy}
          uploading={false}
          configured
          onSend={() => {
            sent();
            setBusy(true);
          }}
          onCancel={cancelled}
          error=""
        />
      );
    }
    render(<Harness />);
    const user = userEvent.setup();
    await user.dblClick(screen.getByRole("button", { name: "Gửi tin nhắn" }));
    expect(sent).toHaveBeenCalledTimes(1);
    expect(cancelled).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Dừng tạo" }));
    expect(cancelled).toHaveBeenCalledTimes(1);
  });
  it("a double click on Stop does not resubmit when cancellation finishes immediately", async () => {
    const sent = vi.fn();
    const cancelled = vi.fn();
    function Harness() {
      const [busy, setBusy] = useState(true);
      return (
        <StudioComposer
          prompt="Tạo slide"
          onPrompt={() => {}}
          documents={[]}
          onRemove={() => {}}
          onUpload={() => {}}
          skill={BUILTIN_SKILLS[0]}
          onSkills={() => {}}
          count={3}
          onCount={() => {}}
          busy={busy}
          uploading={false}
          configured
          onSend={sent}
          onCancel={() => {
            cancelled();
            setBusy(false);
          }}
          error=""
        />
      );
    }
    render(<Harness />);
    const user = userEvent.setup();
    await user.dblClick(screen.getByRole("button", { name: "Dừng tạo" }));
    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(sent).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Gửi tin nhắn" }));
    expect(sent).toHaveBeenCalledTimes(1);
  });
});

describe("AI chat composer: AI chưa cấu hình (Q6-T09)", () => {
  const base = {
    prompt: "",
    onPrompt: () => {},
    documents: [],
    onRemove: () => {},
    onUpload: () => {},
    skill: BUILTIN_SKILLS[0],
    onSkills: () => {},
    count: 3,
    onCount: () => {},
    busy: false,
    uploading: false,
    configured: false,
    onSend: () => {},
    onCancel: () => {},
    error: "",
  };

  it("mặc định / giảng viên: câu liên hệ quản trị viên, không lộ chữ cấu hình", () => {
    render(<StudioComposer {...base} />);
    expect(screen.getByText("Tính năng AI chưa được bật, vui lòng liên hệ quản trị viên.")).toBeTruthy();
    expect(screen.queryByText(/hoàn tất cấu hình/)).toBeNull();
  });

  it("quản trị hệ thống: thấy câu cấu hình", () => {
    render(<StudioComposer {...base} isAdmin />);
    expect(screen.getByText(/Chưa kết nối Viettel AI\. Cần hoàn tất cấu hình/)).toBeTruthy();
  });
});
