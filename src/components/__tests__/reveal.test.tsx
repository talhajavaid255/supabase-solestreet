import { render, screen } from "@testing-library/react";
import Reveal from "@/components/reveal";

describe("Reveal", () => {
  it("renders children and becomes visible when motion is reduced", () => {
    window.matchMedia = jest.fn().mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }) as unknown as typeof window.matchMedia;

    const { container } = render(
      <Reveal>
        <p>Featured kicks</p>
      </Reveal>,
    );

    expect(screen.getByText("Featured kicks")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("is-visible");
  });
});
