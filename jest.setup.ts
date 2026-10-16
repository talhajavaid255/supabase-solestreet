import "@testing-library/jest-dom";
import React from "react";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    fill,
    priority,
    sizes,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
  }) => React.createElement("img", props),
}));

const refresh = jest.fn();
const push = jest.fn();
const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
    push,
    replace,
  }),
}));

beforeEach(() => {
  refresh.mockClear();
  push.mockClear();
  replace.mockClear();
  global.fetch = jest.fn();
});

export const routerMocks = { refresh, push, replace };
