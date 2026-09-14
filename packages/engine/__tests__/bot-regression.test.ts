import { describe, expect, it } from "vitest";
import {
  chooseBotMove,
  createInitialState,
  searchOptionsForDifficulty,
} from "../src/index.js";
import { BOT_PUZZLES } from "./bot-puzzles.fixture.js";
import { createSearchContext, shouldAbort } from "../src/ai-search-context.js";

const hardOpts = {
  ...searchOptionsForDifficulty("hard"),
  timeMs: 400,
};

describe("bot regression puzzles", () => {
  for (const puzzle of BOT_PUZZLES) {
    it(`${puzzle.id}: chooses tactical place`, () => {
      const move = chooseBotMove(puzzle.state, puzzle.player, hardOpts);
      expect(move).not.toBeNull();
      expect(move!.place).toBe(puzzle.expected.place);
    });
  }
});

describe("bot regression clock", () => {
  it("S1: search context aborts after deadline", () => {
    const ctx = createSearchContext(1, 0.01);
    const start = Date.now();
    while (!shouldAbort(ctx) && Date.now() - start < 50) {
      // spin
    }
    expect(shouldAbort(ctx)).toBe(true);
  });

  it("legal move from opening medium", () => {
    const move = chooseBotMove(
      createInitialState(),
      1,
      searchOptionsForDifficulty("medium"),
    );
    expect(move).not.toBeNull();
  });
});
