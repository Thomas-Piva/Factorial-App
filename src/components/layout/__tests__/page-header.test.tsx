import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: unknown;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children as React.ReactNode}
    </a>
  ),
}));

import PageHeader from "@/components/layout/page-header";

describe("PageHeader", () => {
  it("renders title", () => {
    render(<PageHeader title="My Page" />);
    expect(screen.getByText("My Page")).toBeInTheDocument();
  });

  it("renders back link when backHref provided", () => {
    render(<PageHeader title="Detail" backHref="/home" />);
    const backLink = screen.getByRole("link", { name: "Torna indietro" });
    expect(backLink).toHaveAttribute("href", "/home");
  });

  it("does not render back link when backHref not provided", () => {
    render(<PageHeader title="Home" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders action when provided", () => {
    render(<PageHeader title="Home" action={<button>Save</button>} />);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("does not render action slot when action not provided", () => {
    render(<PageHeader title="Home" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
