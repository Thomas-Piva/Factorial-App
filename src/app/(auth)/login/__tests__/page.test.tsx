import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// --- Mocks must be hoisted before imports ---

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush, refresh: mockRefresh })),
}));

const mockSignInWithPassword = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  })),
}));

// Import after mocks are set up
import LoginPage from "@/app/(auth)/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login form with email input, password input, and submit button", () => {
    render(<LoginPage />);

    const emailInput = screen.getByRole("textbox", { name: /email/i });
    expect(emailInput).toBeInTheDocument();

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute("type", "password");

    const submitButton = screen.getByRole("button", {
      name: /accedi|login|entra/i,
    });
    expect(submitButton).toBeInTheDocument();
  });

  it("shows a validation error when form is submitted empty", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const submitButton = screen.getByRole("button", {
      name: /accedi|login|entra/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /email obbligatoria|inserisci.*email|email.*richiesta/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("calls signInWithPassword with correct email and password on submit", async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "123" } },
      error: null,
    });

    render(<LoginPage />);

    await user.type(
      screen.getByRole("textbox", { name: /email/i }),
      "mario@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(
      screen.getByRole("button", { name: /accedi|login|entra/i }),
    );

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "mario@example.com",
        password: "secret123",
      });
    });
  });

  it("shows an error message when authentication fails", async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    render(<LoginPage />);

    await user.type(
      screen.getByRole("textbox", { name: /email/i }),
      "wrong@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(
      screen.getByRole("button", { name: /accedi|login|entra/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      /credenziali non valide/i,
    );
  });

  it("navigates to /home on successful login", async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "123" } },
      error: null,
    });

    render(<LoginPage />);

    await user.type(
      screen.getByRole("textbox", { name: /email/i }),
      "mario@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(
      screen.getByRole("button", { name: /accedi|login|entra/i }),
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/home");
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
