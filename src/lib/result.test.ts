import { describe, expect, it } from "vitest";

import { err, ok } from "./result";

describe("Result helpers", () => {
  it("creates success and error results", () => {
    expect(ok("saved")).toEqual({ ok: true, value: "saved" });
    expect(err("failed")).toEqual({ ok: false, error: "failed" });
  });
});
