/**
 * Q6-PG-17: trang Gia đình của phụ huynh ở 390px: hero cao ~500px đẩy form "Liên kết thêm con" ra ngoài màn đầu.
 * Tranh minh hoạ chỉ hiện từ md trở lên; đệm hero và đệm nội dung gọn hơn trên màn hẹp.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/parent", () => {
  const stub = (name: string) => {
    const Stub = () => <div data-testid={name} />;
    Stub.displayName = `Stub(${name})`;
    return Stub;
  };
  return {
    InviteParentModal: stub("invite"), SentInvitationsList: stub("sent"), PendingInvitationsCard: stub("pending"),
    LinkChildForm: stub("link-child-form"), SentLinkRequests: stub("sent-requests"), LinkedChildrenList: stub("children"),
    IncomingLinkRequestsCard: stub("incoming"), LinkedParentsList: stub("parents"),
  };
});
vi.mock("@/hooks/queries/use-invitation", () => ({ useSentInvitations: () => ({ data: [], isLoading: false }) }));
vi.mock("@/hooks/queries/use-parent-link", () => ({ useLinkedParents: () => ({ data: [], isLoading: false, isError: false }) }));

import FamilySettingsPage from "./page";
import { useAuthStore } from "@/stores/auth.store";

beforeEach(() => useAuthStore.setState({ activeRole: "PARENT" } as never));

describe("/settings/family — phụ huynh ở màn hẹp", () => {
  it("tranh minh hoạ ẩn dưới md (hidden md:block)", () => {
    render(<FamilySettingsPage />);
    const visual = screen.getByTestId("family-hero-visual");
    expect(visual.className).toContain("hidden");
    expect(visual.className).toContain("md:block");
  });

  it("form 'Liên kết thêm con' vẫn có trên trang", () => {
    render(<FamilySettingsPage />);
    expect(screen.getByTestId("link-child-form")).toBeTruthy();
  });
});
