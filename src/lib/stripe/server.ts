import "server-only";
import Stripe from "stripe";

let stripeClient: Stripe | undefined;
export function stripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || !key.startsWith("sk_test_")) {
      throw new Error("STRIPE_SECRET_KEY must be a test-mode secret key");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}
