import { describe, expect, it } from "vitest";
import { configForBoardMode } from "../src/config.js";
import { analyzeLine } from "../src/patterns.js";

const strategic = configForBoardMode("strategic");

describe("strategic scoring profile", () => {
  it("does not count L2 on a short partial (R=2 only)", () => {
    const a = analyzeLine([1, 1], strategic);
    expect(a.contributions).toHaveLength(0);
  });

  it("counts L3 when R>=3", () => {
    const a = analyzeLine([1, 1, 1], strategic);
    expect(a.contributions.some((c) => c.level === 3 && c.kind === "repetition")).toBe(
      true,
    );
  });

  it("caps diversity at 6", () => {
    const cells = [1, 2, 3, 4, 5, 6] as const;
    const a = analyzeLine([...cells], strategic);
    expect(a.D).toBe(6);
  });
});
