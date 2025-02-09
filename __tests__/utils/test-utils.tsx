// __tests__/utils/test-utils.tsx
import { render } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";

const AllTheProviders = ({ children }) => {
  return <SessionProvider>{children}</SessionProvider>;
};

const customRender = (ui, options = {}) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
