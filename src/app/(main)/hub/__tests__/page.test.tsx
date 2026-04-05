/**
 * Task 2: Tests for /hub page (Manager dashboard)
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";

// ── Next.js mocks ─────────────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/hub"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// ── Import after mocks ────────────────────────────────────────────────────────
import HubPage from "../page";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("HubPage", () => {
  it('renders "Hub" heading', () => {
    render(<HubPage />);
    expect(screen.getByRole("heading", { name: /^hub$/i })).toBeInTheDocument();
  });

  it('has data-testid="hub-page"', () => {
    render(<HubPage />);
    expect(screen.getByTestId("hub-page")).toBeInTheDocument();
  });

  it("renders Turni card with label", () => {
    render(<HubPage />);
    expect(screen.getByText("Turni")).toBeInTheDocument();
  });

  it("renders Assenze card with label", () => {
    render(<HubPage />);
    expect(screen.getByText("Assenze")).toBeInTheDocument();
  });

  it("renders Persone card with label", () => {
    render(<HubPage />);
    expect(screen.getByText("Persone")).toBeInTheDocument();
  });

  it("Turni card links to /turni", () => {
    render(<HubPage />);
    const turniLink = screen.getByRole("link", { name: /turni/i });
    expect(turniLink).toHaveAttribute("href", "/turni");
  });

  it("Assenze card links to /assenze", () => {
    render(<HubPage />);
    const assenzeLink = screen.getByRole("link", { name: /assenze/i });
    expect(assenzeLink).toHaveAttribute("href", "/assenze");
  });

  it("Persone card links to /persone", () => {
    render(<HubPage />);
    const personeLink = screen.getByRole("link", { name: /persone/i });
    expect(personeLink).toHaveAttribute("href", "/persone");
  });

  it("renders calendar_month icon", () => {
    render(<HubPage />);
    expect(screen.getByText("calendar_month")).toBeInTheDocument();
  });

  it("renders event_busy icon", () => {
    render(<HubPage />);
    expect(screen.getByText("event_busy")).toBeInTheDocument();
  });

  it("renders group icon", () => {
    render(<HubPage />);
    expect(screen.getByText("group")).toBeInTheDocument();
  });
});
