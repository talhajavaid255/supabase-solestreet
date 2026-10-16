
"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signInWithGoogle() {
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data.url) {
      setError("Unable to start Google sign-in.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-6 py-12 text-zinc-900">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="text-3xl font-black tracking-tighter text-zinc-950"
          >
            SOLESTREET<span className="text-orange-600">.</span>
          </Link>

          <p className="mt-3 text-sm text-zinc-500">
            Your style. Your stride.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-xl shadow-zinc-900/5 sm:p-10">
          <div className="mb-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
              Welcome to SoleStreet
            </p>

            <h1 className="text-3xl font-black tracking-tight text-zinc-950">
              Welcome back
            </h1>

            <p className="mt-3 leading-7 text-zinc-500">
              Sign in to explore your favorites and manage your shopping
              experience.
            </p>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-zinc-950 px-5 py-4 font-bold text-white transition duration-200 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {/* Google icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.03 46.98 31.88 46.98 24.55z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.92 7.53 2.53 10.78l8-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-8 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>

            {loading ? "Redirecting to Google..." : "Continue with Google"}
          </button>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs text-zinc-400">
              SECURE SIGN IN
            </span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <p className="mt-6 text-center text-sm leading-6 text-zinc-500">
            Sign in securely using your Google account.
          </p>
        </div>

        {/* Back Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-zinc-600 transition hover:text-orange-600"
          >
            ← Back to shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
