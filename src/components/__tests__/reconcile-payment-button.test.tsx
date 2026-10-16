import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReconcilePaymentButton from "@/components/reconcile-payment-button";
import { routerMocks } from "../../../jest.setup";

function mockFetch(response: Partial<Response> & { json: () => Promise<unknown> }) {
  (global.fetch as jest.Mock).mockResolvedValue(response);
}

describe("ReconcilePaymentButton", () => {
  it("verifies payment and refreshes the page on success", async () => {
    const user = userEvent.setup();
    mockFetch({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ReconcilePaymentButton orderId="11111111-1111-1111-1111-111111111111" />);
    await user.click(screen.getByRole("button", { name: "Verify Payment with Stripe" }));

    expect(global.fetch).toHaveBeenCalledWith("/api/stripe/reconcile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: "11111111-1111-1111-1111-111111111111" }),
    });
    expect(screen.getByRole("status")).toHaveTextContent("Payment verified successfully.");
    expect(routerMocks.refresh).toHaveBeenCalled();
  });

  it("shows an API error message", async () => {
    const user = userEvent.setup();
    mockFetch({
      ok: false,
      json: async () => ({ success: false, error: "Order not found" }),
    });

    render(<ReconcilePaymentButton orderId="11111111-1111-1111-1111-111111111111" />);
    await user.click(screen.getByRole("button", { name: "Verify Payment with Stripe" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Order not found");
  });

  it("shows a network error when fetch throws", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockRejectedValue(new Error("offline"));

    render(<ReconcilePaymentButton orderId="11111111-1111-1111-1111-111111111111" />);
    await user.click(screen.getByRole("button", { name: "Verify Payment with Stripe" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something went wrong while verifying payment.",
    );
  });
});
