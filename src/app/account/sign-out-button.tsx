
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={signOut}
        disabled={loading}
        className="rounded-full bg-zinc-950 px-8 py-3 text-sm font-bold text-white transition duration-200 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Signing out..." : "Sign out →"}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
