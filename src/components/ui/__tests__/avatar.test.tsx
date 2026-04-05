import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  ),
}));

import { Avatar } from "@/components/ui/avatar";

describe("Avatar", () => {
  it("shows initials when no src provided", () => {
    render(<Avatar firstName="John" lastName="Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows initials in uppercase", () => {
    render(<Avatar firstName="anna" lastName="rossi" />);
    expect(screen.getByText("AR")).toBeInTheDocument();
  });

  it("shows image when src provided with correct alt", () => {
    render(
      <Avatar
        src="https://example.supabase.co/photo.jpg"
        firstName="John"
        lastName="Doe"
      />,
    );
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("alt", "John Doe");
    expect(img).toHaveAttribute("src", "https://example.supabase.co/photo.jpg");
  });

  it("shows initials when src is null", () => {
    render(<Avatar src={null} firstName="Jane" lastName="Smith" />);
    expect(screen.getByText("JS")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("applies sm size classes", () => {
    render(<Avatar firstName="A" lastName="B" size="sm" />);
    const el = screen.getByText("AB");
    expect(el.className || el.parentElement?.className).toMatch(/w-8|h-8/);
  });

  it("applies md size classes", () => {
    render(<Avatar firstName="A" lastName="B" size="md" />);
    const el = screen.getByText("AB");
    expect(el.className || el.parentElement?.className).toMatch(/w-10|h-10/);
  });

  it("applies lg size classes", () => {
    render(<Avatar firstName="A" lastName="B" size="lg" />);
    const el = screen.getByText("AB");
    expect(el.className || el.parentElement?.className).toMatch(/w-14|h-14/);
  });

  it("is always circular with rounded-full", () => {
    render(<Avatar firstName="A" lastName="B" />);
    const el = screen.getByText("AB");
    const hasRoundedFull =
      el.classList.contains("rounded-full") ||
      el.parentElement?.classList.contains("rounded-full");
    expect(hasRoundedFull).toBe(true);
  });
});
