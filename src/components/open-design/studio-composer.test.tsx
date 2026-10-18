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
