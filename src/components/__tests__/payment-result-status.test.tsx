import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaymentResultStatus from "@/components/payment-result-status";

const orderId = "fcdda7a5-2e17-4fe3-9d53-cf2f67972e0c";

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  };
}

describe("PaymentResultStatus", () => {
  it("shows a paid result without the verify button", () => {
    render(
      <PaymentResultStatus
        orderId={orderId}
        initial={{ status: "paid", payment_status: "paid" }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Payment successful" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /verify with stripe now/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View order →" })).toHaveAttribute(
      "href",
      `/account/orders/${orderId}`,
    );
  });

  it("shows expired checkout copy", () => {
    render(
      <PaymentResultStatus
        orderId={orderId}
        initial={{ status: "cancelled", payment_status: "expired" }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Checkout expired" })).toBeInTheDocument();
  });

  it("auto-reconciles a pending order and then shows paid", async () => {
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (String(url).includes("/api/stripe/status")) {
        return jsonResponse({ status: "paid", payment_status: "paid" });
      }
      return jsonResponse({ success: true });
    });

    render(
      <PaymentResultStatus
        orderId={orderId}
        initial={{ status: "pending", payment_status: "checkout_open" }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Payment being verified" })).toBeInTheDocument();
    expect(screen.getByText("FCDDA7A5")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Payment successful" })).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/stripe/reconcile",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows a verification error from the manual button", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse({}, false));

    render(
      <PaymentResultStatus
        orderId={orderId}
        initial={{ status: "pending", payment_status: "checkout_open" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Verify with Stripe now" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Verification unavailable. Try again later.",
    );
  });
});
