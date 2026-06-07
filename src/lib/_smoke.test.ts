import { describe, it, expect } from "vitest";
import { cn } from "@/lib/cn";

describe("smoke", () => {
  it("runs the test suite", () => {
    expect(1 + 1).toBe(2);
  });

  it("cn merges classes and resolves conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-text", false, "font-mono")).toContain("font-mono");
  });
});
