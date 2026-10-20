import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const claims = data.claims;

  const email =
    typeof claims.email === "string"
      ? claims.email
      : "Authenticated customer";

  const displayName = email.split("@")[0];

  return (
    <main className="min-h-screen bg-[#faf9f6] text-zinc-900">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
            Your personal space
          </p>

          <h1 className="text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
            My Account
          </h1>

          <p className="mt-4 text-zinc-500">
            Manage your profile and shopping experience.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-100 text-2xl font-black text-orange-600">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="text-sm font-medium text-green-700">
                ● Signed in
              </p>
              <h2 className="mt-1 text-2xl font-black text-zinc-950">
                Hello, {displayName}!
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Welcome to your SoleStreet account.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-zinc-50 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Email Address
              </p>
              <p className="mt-3 break-all font-semibold text-zinc-900">
                {email}
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-50 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Authentication
              </p>
              <p className="mt-3 font-semibold text-zinc-900">
                Google Account
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Link
            href="/account/orders"
            className="group block rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-orange-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-950">My Orders</h3>
              <span className="text-xl text-orange-600 transition group-hover:translate-x-1">
                →
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              View your order history, shipping details, and manage eligible
              demo cancellations.
            </p>
            <span className="mt-5 inline-block text-sm font-bold text-orange-600">
              View Orders
            </span>
          </Link>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h3 className="font-bold text-zinc-950">Saved Addresses</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Manage your shipping and delivery information.
            </p>
            <span className="mt-4 inline-block text-xs font-semibold text-orange-600">
              Coming soon
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
