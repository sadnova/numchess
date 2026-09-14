import { describe, expect, it } from "vitest";
import { configForBoardMode } from "../src/config.js";
import { getScoringLines } from "../src/lines.js";

const strategic = configForBoardMode("strategic");
const classic = configForBoardMode("classic");

describe("strategic lines geometry", () => {
  it("Classic still has 9 lines per perspective", () => {
    expect(getScoringLines("rows", classic)).toHaveLength(9);
    expect(getScoringLines("columns", classic)).toHaveLength(9);
  });

  it("Strategic has 13 lines per perspective (8 orthogonals + 5 diagonals)", () => {
    expect(getScoringLines("rows", strategic)).toHaveLength(13);
    expect(getScoringLines("columns", strategic)).toHaveLength(13);
  });

  it("Strategic diagonal lengths 8 / 7 / 7 / 6 / 6 on rows side", () => {
    const rows = getScoringLines("rows", strategic);
    expect(rows.find((l) => l.id === "diag-se")!.indices).toHaveLength(8);
    expect(rows.find((l) => l.id === "diag-se-ne")!.indices).toHaveLength(7);
    expect(rows.find((l) => l.id === "diag-se-sw")!.indices).toHaveLength(7);
    expect(rows.find((l) => l.id === "diag-se-ne2")!.indices).toHaveLength(6);
    expect(rows.find((l) => l.id === "diag-se-sw2")!.indices).toHaveLength(6);
  });

  it("Strategic diagonal lengths on columns side", () => {
    const cols = getScoringLines("columns", strategic);
    expect(cols.find((l) => l.id === "diag-sw")!.indices).toHaveLength(8);
    expect(cols.find((l) => l.id === "diag-sw-nw")!.indices).toHaveLength(7);
    expect(cols.find((l) => l.id === "diag-sw-se")!.indices).toHaveLength(7);
    expect(cols.find((l) => l.id === "diag-sw-nw2")!.indices).toHaveLength(6);
    expect(cols.find((l) => l.id === "diag-sw-se2")!.indices).toHaveLength(6);
  });
});
