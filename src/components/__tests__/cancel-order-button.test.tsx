import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CancelOrderButton from "@/components/cancel-order-button";
import { cancelDemoOrder } from "@/app/account/orders/actions";
import { routerMocks } from "../../../jest.setup";

jest.mock("@/app/account/orders/actions", () => ({
  cancelDemoOrder: jest.fn(),
}));

const cancelDemoOrderMock = cancelDemoOrder as jest.MockedFunction<typeof cancelDemoOrder>;

describe("CancelOrderButton", () => {
  beforeEach(() => {
    cancelDemoOrderMock.mockReset();
  });

  it("opens and closes the confirmation dialog", async () => {
    const user = userEvent.setup();
    render(<CancelOrderButton orderId="order-1" />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel Demo Order" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Keep Order" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("cancels the order and refreshes on success", async () => {
    const user = userEvent.setup();
    cancelDemoOrderMock.mockResolvedValue({ success: true, alreadyCancelled: false });

    render(<CancelOrderButton orderId="order-1" />);
    await user.click(screen.getByRole("button", { name: "Cancel Demo Order" }));
    await user.click(screen.getByRole("button", { name: "Yes, Cancel" }));

    expect(cancelDemoOrderMock).toHaveBeenCalledWith("order-1");
    expect(routerMocks.refresh).toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shows an error when cancellation fails", async () => {
    const user = userEvent.setup();
    cancelDemoOrderMock.mockResolvedValue({
      success: false,
      error: "Stripe orders cannot be cancelled here.",
    });

    render(<CancelOrderButton orderId="order-1" />);
    await user.click(screen.getByRole("button", { name: "Cancel Demo Order" }));
    await user.click(screen.getByRole("button", { name: "Yes, Cancel" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Stripe orders cannot be cancelled here.",
    );
  });
});
