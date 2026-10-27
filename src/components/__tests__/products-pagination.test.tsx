import { render, screen } from "@testing-library/react";
import ProductsPagination, { catalogHref } from "@/components/products-pagination";

describe("catalogHref", () => {
  it("omits the first page and default sort", () => {
    expect(catalogHref({ page: 1, sort: "newest" })).toBe("/products");
    expect(catalogHref({ q: "puma", page: 2, sort: "price_asc" })).toBe(
      "/products?q=puma&sort=price_asc&page=2",
    );
  });
});

describe("ProductsPagination", () => {
  it("renders numbered pages and next for the first page", () => {
    render(
      <ProductsPagination
        page={1}
        totalPages={3}
        filters={{ q: "", brand: "", category: "", sort: "newest" }}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Product pages" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute("href", "/products?page=2");
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/products?page=2");
    expect(screen.queryByRole("link", { name: "Previous" })).not.toBeInTheDocument();
  });
});
