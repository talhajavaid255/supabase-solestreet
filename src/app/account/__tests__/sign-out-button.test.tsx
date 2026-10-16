import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignOutButton from "@/app/account/sign-out-button";
import { createClient } from "@/lib/supabase/client";
import { routerMocks } from "../../../../jest.setup";

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

const createClientMock = createClient as jest.MockedFunction<typeof createClient>;

describe("SignOutButton", () => {
  it("signs out and sends the user to login", async () => {
    const user = userEvent.setup();
    const signOut = jest.fn().mockResolvedValue({ error: null });
    createClientMock.mockReturnValue({ auth: { signOut } } as never);

    render(<SignOutButton />);
    await user.click(screen.getByRole("button", { name: "Sign out →" }));

    expect(signOut).toHaveBeenCalled();
    expect(routerMocks.replace).toHaveBeenCalledWith("/login");
    expect(routerMocks.refresh).toHaveBeenCalled();
  });

  it("shows the auth error message", async () => {
    const user = userEvent.setup();
    createClientMock.mockReturnValue({
      auth: {
        signOut: jest.fn().mockResolvedValue({ error: { message: "Session expired" } }),
      },
    } as never);

    render(<SignOutButton />);
    await user.click(screen.getByRole("button", { name: "Sign out →" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Session expired");
    expect(routerMocks.replace).not.toHaveBeenCalled();
  });
});
