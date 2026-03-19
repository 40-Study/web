import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

describe("Vitest + RTL Sanity", () => {
  it("provides jest-dom matchers via setup file", () => {
    render(<span data-testid="sanity-el">hello</span>);
    expect(screen.getByTestId("sanity-el")).toBeInTheDocument();
  });

  it("provides jsdom DOM environment", () => {
    expect(document.createElement("div").tagName).toBe("DIV");
  });

  it("runs non-watch mode correctly", () => {
    expect(1 + 1).toBe(2);
  });
});
