import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders label text", () => {
    render(<Badge label="Morning" />);
    expect(screen.getByText("Morning")).toBeInTheDocument();
  });

  it("applies pill shape classes", () => {
    render(<Badge label="Test" />);
    const el = screen.getByText("Test");
    expect(el).toHaveClass("rounded-full");
    expect(el).toHaveClass("px-3");
    expect(el).toHaveClass("py-1");
  });

  it("applies custom backgroundColor when color prop provided", () => {
    render(<Badge label="Shift" color="#ff5733" />);
    const el = screen.getByText("Shift");
    expect(el).toHaveStyle({ backgroundColor: "#ff5733" });
  });

  it("uses default surface classes when no color provided", () => {
    render(<Badge label="Default" />);
    const el = screen.getByText("Default");
    expect(el).toHaveClass("bg-surface-container");
    expect(el).toHaveClass("text-on-surface-variant");
  });

  it("renders outline variant with ring class", () => {
    render(<Badge label="Outline" variant="outline" />);
    const el = screen.getByText("Outline");
    expect(el).toHaveClass("ring-1");
    expect(el).toHaveClass("ring-current");
  });

  it("renders default variant without outline ring", () => {
    render(<Badge label="NoRing" variant="default" />);
    const el = screen.getByText("NoRing");
    expect(el).not.toHaveClass("ring-1");
  });
});
