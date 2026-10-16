import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckoutDelivery from "@/components/checkout-delivery";

const addresses = [
  {
    id: "addr-1",
    full_name: "Alex Rivera",
    line1: "12 Market St",
    line2: null,
    city: "Austin",
    state: "TX",
    postal_code: "78701",
    country_code: "US",
    is_default: true,
  },
  {
    id: "addr-2",
    full_name: "Alex Rivera",
    line1: "90 Lake Ave",
    line2: "Apt 4",
    city: "Dallas",
    state: "TX",
    postal_code: "75201",
    country_code: "US",
    is_default: false,
  },
];

describe("CheckoutDelivery", () => {
  it("selects the default address and shows a free shipping Stripe total", () => {
    render(<CheckoutDelivery addresses={addresses} subtotal={80} />);

    expect(screen.getByDisplayValue("addr-1")).toBeChecked();
    expect(screen.getByRole("button", { name: /pay \$80\.00 with stripe/i })).toBeEnabled();
  });

  it("adds express shipping and can switch to a demo order", async () => {
    const user = userEvent.setup();
    render(<CheckoutDelivery addresses={addresses} subtotal={80} />);

    await user.click(screen.getByText("Express"));
    expect(screen.getByRole("button", { name: /pay \$92\.00 with stripe/i })).toBeEnabled();

    await user.click(screen.getByText("Place Demo Order"));
    expect(screen.getByRole("button", { name: /place demo order/i })).toBeInTheDocument();
  });

  it("disables submit when there is no address", () => {
    render(<CheckoutDelivery addresses={[]} subtotal={40} />);
    expect(screen.getByRole("button", { name: /pay/i })).toBeDisabled();
  });
});
