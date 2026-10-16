import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CartItemControls from "@/components/cart-item-controls";
import { removeCartItem, updateCartQuantity } from "@/app/cart/actions";
import { routerMocks } from "../../../jest.setup";

jest.mock("@/app/cart/actions", () => ({
  updateCartQuantity: jest.fn(),
  removeCartItem: jest.fn(),
}));

const updateCartQuantityMock = updateCartQuantity as jest.MockedFunction<
  typeof updateCartQuantity
>;
const removeCartItemMock = removeCartItem as jest.MockedFunction<typeof removeCartItem>;

describe("CartItemControls", () => {
  beforeEach(() => {
    updateCartQuantityMock.mockReset();
    removeCartItemMock.mockReset();
  });

  it("does not decrease quantity below 1", () => {
    render(<CartItemControls itemId="item-1" quantity={1} maxStock={5} />);
    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
  });

  it("increases quantity and refreshes the cart on success", async () => {
    const user = userEvent.setup();
    updateCartQuantityMock.mockResolvedValue({ success: true });

    render(<CartItemControls itemId="item-1" quantity={2} maxStock={5} />);
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));

    expect(updateCartQuantityMock).toHaveBeenCalledWith("item-1", 3);
    expect(routerMocks.refresh).toHaveBeenCalled();
  });

  it("removes an item and surfaces action errors", async () => {
    const user = userEvent.setup();
    removeCartItemMock.mockResolvedValue({ success: false, error: "Still in checkout." });

    render(<CartItemControls itemId="item-1" quantity={2} maxStock={5} />);
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(removeCartItemMock).toHaveBeenCalledWith("item-1");
    expect(screen.getByRole("alert")).toHaveTextContent("Still in checkout.");
  });
});
