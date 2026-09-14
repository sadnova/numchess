import { describe, expect, it } from "vitest";
import { analyzeLine } from "../src/index.js";

/**
 * Prototype bug: diversity used `pop()` on sorted unique keys, dropping valid levels.
 * Engine uses distinct key count — this test documents correct diversity on 1..5 line.
 */
describe("legacy prototype divergence", () => {
  it("does not use pop-based diversity (six distinct values cap at D=5)", () => {
    const wrongPopDiversity = () => {
      const cells = [1, 2, 3, 4, 5, 1];
      const keys = [...new Set(cells)].sort((a, b) => b - a);
      keys.pop();
      return keys.length;
    };
    const engine = analyzeLine([1, 2, 3, 4, 5, 1]);
    expect(wrongPopDiversity()).toBe(4);
    expect(engine.D).toBe(5);
  });
});
