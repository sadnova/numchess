import { describe, expect, it } from "vitest";
import { configForBoardMode } from "../src/config.js";
import { applyAction, createInitialState, getLegalActions } from "../src/state.js";
import { cellCount } from "../src/config.js";

function playFirstLegal(state: ReturnType<typeof createInitialState>) {
  const a = getLegalActions(state)[0];
  if (!a) return state;
  if (a.type === "SELECT") {
    return applyAction(state, { type: "SELECT", value: a.value }).value!;
  }
  return applyAction(state, { type: "PLACE", index: a.index }).value!;
}

describe("strategic state", () => {
  it("starts with 64 empty cells and tile 6 in inventory", () => {
    const s = createInitialState(configForBoardMode("strategic"));
    expect(s.board).toHaveLength(64);
    expect(s.inventories[0].counts[6]).toBe(6);
    expect(
      getLegalActions(s).some((a) => a.type === "SELECT" && a.value === 6),
    ).toBe(true);
  });

  it("can play until game ends at 64 plies", () => {
    let s = createInitialState(configForBoardMode("strategic"));
    let guard = 0;
    while (s.phase.kind !== "ended" && guard++ < 200) {
      s = playFirstLegal(s);
    }
    expect(s.phase.kind).toBe("ended");
    expect(s.ply).toBe(cellCount(s.config));
  });
});
