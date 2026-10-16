import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductDetails from "@/components/product-details";
import { addToCart } from "@/app/cart/actions";
import { routerMocks } from "../../../jest.setup";

jest.mock("@/app/cart/actions", () => ({
  addToCart: jest.fn(),
}));

const addToCartMock = addToCart as jest.MockedFunction<typeof addToCart>;

const product = {
  id: "p1",
  name: "Court Low",
  description: "Everyday court shoe.",
  price: 90,
  compare_at_price: 120,
  product_images: [
    { image_url: "https://cdn.example/1.jpg", alt_text: "Front", sort_order: 0 },
    { image_url: "https://cdn.example/2.jpg", alt_text: "Side", sort_order: 1 },
  ],
  product_variants: [
    { id: "v-black-8", size: "8", color: "Black", stock_quantity: 3 },
    { id: "v-black-9", size: "9", color: "Black", stock_quantity: 0 },
    { id: "v-white-8", size: "8", color: "White", stock_quantity: 2 },
  ],
};

describe("ProductDetails", () => {
  beforeEach(() => {
    addToCartMock.mockReset();
  });

  it("renders product copy, sale price, and keeps add to cart disabled until a size is chosen", () => {
    render(<ProductDetails product={product} />);

    expect(screen.getByRole("heading", { name: "Court Low" })).toBeInTheDocument();
    expect(screen.getByText("Everyday court shoe.")).toBeInTheDocument();
    expect(screen.getByText("$90.00")).toBeInTheDocument();
    expect(screen.getByText("$120.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeDisabled();
    expect(screen.getByText("Select a size to check availability.")).toBeInTheDocument();
  });

  it("selects a size, caps quantity at stock, and adds the variant to the cart", async () => {
    const user = userEvent.setup();
    addToCartMock.mockResolvedValue({ success: true });

    render(<ProductDetails product={product} />);

    await user.click(screen.getByRole("button", { name: "8" }));
    expect(screen.getByText("In stock — 3 available")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(addToCartMock).toHaveBeenCalledWith("v-black-8", 3);
    expect(routerMocks.push).toHaveBeenCalledWith("/cart");
  });

  it("switches color, disables out-of-stock sizes, and sends shoppers to login when required", async () => {
    const user = userEvent.setup();
    addToCartMock.mockResolvedValue({
      success: false,
      error: "Please sign in to continue.",
    });

    render(<ProductDetails product={product} />);

    expect(screen.getByRole("button", { name: "9" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "White" }));
    expect(screen.getByText("Color: White")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "9" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "8" }));
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(routerMocks.push).toHaveBeenCalledWith("/login");
  });

  it("shows a cart error when add to cart fails", async () => {
    const user = userEvent.setup();
    addToCartMock.mockResolvedValue({ success: false, error: "Sold out." });

    render(<ProductDetails product={product} />);
    await user.click(screen.getByRole("button", { name: "8" }));
    await user.click(screen.getByRole("button", { name: /add to cart/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Sold out.");
  });
});
