import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button asChild", () => {
  it("renders the child element itself with button classes, no wrapper", () => {
    const { container } = render(
      <Button asChild variant="outline">
        <a href="/x" className="extra">
          Go
        </a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Go" });
    expect(container.firstElementChild).toBe(link);
    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector("span")).toBeNull();
    expect(link.getAttribute("href")).toBe("/x");
    expect(link.className).toContain("inline-flex");
    expect(link.className).toContain("extra");
  });

  it("keeps child and Button click handlers and forwards ref", () => {
    const childClick = vi.fn();
    const buttonClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button asChild onClick={buttonClick} ref={ref}>
        <a href="#y" onClick={childClick}>
          Y
        </a>
      </Button>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Y" }));
    expect(childClick).toHaveBeenCalledTimes(1);
    expect(buttonClick).toHaveBeenCalledTimes(1);
    expect(ref.current).toBe(screen.getByRole("link", { name: "Y" }));
  });

  it("marks disabled asChild via aria-disabled", () => {
    render(
      <Button asChild disabled>
        <a href="/z">Z</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Z" }).getAttribute("aria-disabled")).toBe("true");
  });
});
