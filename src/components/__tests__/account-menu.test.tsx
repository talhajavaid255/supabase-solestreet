import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountMenu from "@/components/account-menu";
import { createClient } from "@/lib/supabase/client";
import { routerMocks } from "../../../jest.setup";

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

const createClientMock = createClient as jest.MockedFunction<typeof createClient>;

describe("AccountMenu", () => {
  it("opens a dropdown with account, orders, and sign out", async () => {
    const user = userEvent.setup();
    render(
      <AccountMenu name="talha" email="talha@example.com" initial="T" />,
    );

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /talha/i }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Account" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(screen.getByRole("menuitem", { name: "Orders" })).toHaveAttribute(
      "href",
      "/account/orders",
    );
    expect(screen.getByText("talha@example.com")).toBeInTheDocument();
  });

  it("signs out and sends the user to login", async () => {
    const user = userEvent.setup();
    const signOut = jest.fn().mockResolvedValue({ error: null });
    createClientMock.mockReturnValue({ auth: { signOut } } as never);

    render(
      <AccountMenu name="talha" email="talha@example.com" initial="T" />,
    );
    await user.click(screen.getByRole("button", { name: /talha/i }));
    await user.click(screen.getByRole("menuitem", { name: "Sign out" }));

    expect(signOut).toHaveBeenCalled();
    expect(routerMocks.replace).toHaveBeenCalledWith("/login");
    expect(routerMocks.refresh).toHaveBeenCalled();
  });
});
