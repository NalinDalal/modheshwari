import { render } from "@testing-library/react";
import React from "react";
import { Button } from "./button";

describe("Button", () => {
  it("renders without crashing", () => {
    const { getByRole } = render(<Button>Click me</Button>);
    expect(getByRole("button")).toBeInTheDocument();
  });
});
