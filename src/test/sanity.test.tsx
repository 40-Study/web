import { describe, it, expect } from "vitest";
import { render, screen } from "./test-utils";

describe("Sanity Check", () => {
  it("testing framework works", () => {
    expect(1 + 1).toBe(2);
  });

  it("react testing library works", () => {
    render(<div>Hello World</div>);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });
});
