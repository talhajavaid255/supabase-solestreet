import { render, screen } from "@testing-library/react";
import ProductCard from "@/components/product-card";

const baseProduct = {
  id: "p1",
  name: "Aero Runner",
  slug: "aero-runner",
  price: 129.5,
  compare_at_price: null as number | null,
  is_featured: false,
  brands: { name: "Nike" },
  product_images: [
    {
      image_url: "https://cdn.example/later.jpg",
      alt_text: "Later shot",
      sort_order: 2,
    },
    {
      image_url: "https://cdn.example/hero.jpg",
      alt_text: "Hero shot",
      sort_order: 0,
    },
  ],
};

describe("ProductCard", () => {
  it("renders brand, name, price, and a product link", () => {
    render(<ProductCard product={baseProduct} />);

    expect(screen.getByText("Nike")).toBeInTheDocument();
    expect(screen.getByText("Aero Runner")).toBeInTheDocument();
    expect(screen.getByText("$129.50")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Aero Runner" })).toHaveAttribute(
      "href",
      "/products/aero-runner",
    );
    expect(screen.getByAltText("Hero shot")).toHaveAttribute(
      "src",
      "https://cdn.example/hero.jpg",
    );
  });

  it("shows featured badge and compare-at price when applicable", () => {
    render(
      <ProductCard
        product={{
          ...baseProduct,
          is_featured: true,
          compare_at_price: 160,
        }}
      />,
    );

    expect(screen.getByText("Featured")).toBeInTheDocument();
    expect(screen.getByText("$160.00")).toHaveClass("line-through");
  });

  it("falls back when there is no image or brand", () => {
    render(
      <ProductCard
        product={{
          ...baseProduct,
          brands: null,
          product_images: [],
        }}
      />,
    );

    expect(screen.getByText("SoleStreet")).toBeInTheDocument();
    expect(screen.getByText("Image unavailable")).toBeInTheDocument();
  });
});
