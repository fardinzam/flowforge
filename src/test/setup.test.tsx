import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createUserFactory } from "./factories";

describe("test harness", () => {
  it("runs component tests in jsdom with jest-dom matchers", () => {
    render(<button type="button">Create workflow</button>);

    expect(
      screen.getByRole("button", { name: "Create workflow" }),
    ).toBeInTheDocument();
  });

  it("creates deterministic domain test data without Supabase", () => {
    expect(createUserFactory({ id: "user_123" })).toEqual({
      id: "user_123",
      email: "developer@example.com",
      name: "Developer",
    });
  });
});
