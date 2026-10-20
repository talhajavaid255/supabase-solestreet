import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AccountMenu from "@/components/account-menu";

function displayNameFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : "";
  if (metadataName.trim()) return metadataName.trim();
  const email = user.email ?? "";
  return email.includes("@") ? email.split("@")[0] : "Account";
}

export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let cartCount = 0;
  if (user) {
    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (cart) {
      const { data: items } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("cart_id", cart.id);
      cartCount = (items ?? []).reduce(
        (sum, item) => sum + Number(item.quantity ?? 0),
        0,
      );
    }
  }

  const name = user ? displayNameFromUser(user) : "";
  const email = user?.email ?? "";
  const initial = name.charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="bg-zinc-950 px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-white">
        NEW SEASON COLLECTION · FIND YOUR EVERYDAY FIT
      </div>
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="text-2xl font-black tracking-tighter text-zinc-950"
        >
          SOLESTREET<span className="text-orange-600">.</span>
        </Link>

        <div className="flex items-center gap-5 text-sm font-semibold text-zinc-700 sm:gap-7">
          <Link href="/products" className="nav-link hover:text-orange-600">
            Shop
          </Link>
          <Link href="/cart" className="nav-link relative hover:text-orange-600">
            Cart
            {cartCount > 0 ? (
              <span className="cart-badge ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-orange-600 px-1.5 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
          {user ? (
            <AccountMenu name={name} email={email} initial={initial} />
          ) : (
            <Link
              href="/login"
              className="pressable rounded-full bg-zinc-950 px-4 py-2 text-white hover:bg-orange-600"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
