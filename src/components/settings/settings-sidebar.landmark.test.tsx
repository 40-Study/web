/** Q8-PG-10 (axe landmark-unique): hai `nav` không tên trên /settings ở 390px (thanh dưới + mục cài đặt). */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/queries/use-auth", () => ({ useLogout: () => ({ mutate: vi.fn(), isPending: false }) }));

import { SettingsSidebar } from "./settings-sidebar";

describe("SettingsSidebar landmark (Q8-PG-10)", () => {
  it("nav có tên 'Mục cài đặt'", () => {
    render(<SettingsSidebar activeSection="profile" onSectionChange={() => {}} />);
    expect(screen.getByRole("navigation", { name: "Mục cài đặt" })).toBeTruthy();
  });
});
