"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email obbligatoria");
      return;
    }

    if (!password) {
      setError("Password obbligatoria");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Credenziali non valide. Riprova.");
        return;
      }

      router.push("/home");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-3xl bg-surface-lowest p-8 shadow-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1
            className="text-3xl font-bold text-on-surface"
            style={{ fontWeight: 700 }}
          >
            Factorial
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">Gestione turni</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-on-surface-variant"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mario@example.com"
                className="rounded-full bg-surface-container px-5 py-3 text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:bg-surface-lowest transition-colors"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="password"
                className="text-sm font-medium text-on-surface-variant"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-full bg-surface-container px-5 py-3 text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:bg-surface-lowest transition-colors"
              />
            </div>

            {/* Error message */}
            {error && (
              <p role="alert" className="text-sm text-error text-center">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-opacity disabled:opacity-60"
            >
              {loading ? "Accesso in corso…" : "Accedi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
