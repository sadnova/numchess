import { indexToRowCol } from "@numchess/engine";
import type { DiagonalGuideSpec } from "@/lib/diagonalGuides";

export type CellRect = { x: number; y: number; w: number; h: number };

function orderedRects(
  indices: number[],
  rects: Map<number, CellRect>,
): CellRect[] {
  return [...indices]
    .sort((a, b) => {
      const ra = indexToRowCol(a);
      const rb = indexToRowCol(b);
      return ra.row - rb.row || ra.col - rb.col;
    })
    .map((i) => rects.get(i))
    .filter((r): r is CellRect => r != null);
}

function inflate(r: CellRect, by: number): CellRect {
  return { x: r.x - by, y: r.y - by, w: r.w + by * 2, h: r.h + by * 2 };
}

/** Half of the grid gap between two adjacent cells on a diagonal step. */
function gapHalf(a: CellRect, b: CellRect): number {
  const gx = b.x - (a.x + a.w);
  const gy = b.y - (a.y + a.h);
  const g = Math.min(gx, gy);
  return Math.max(3, g / 2);
}

function chainOutset(rects: CellRect[]): number {
  if (rects.length < 2) return 5;
  return gapHalf(rects[0]!, rects[1]!) + 2;
}

function gapCenter(a: CellRect, b: CellRect): { x: number; y: number } {
  return {
    x: (a.x + a.w + b.x) / 2,
    y: (a.y + a.h + b.y) / 2,
  };
}

/** Rounded rect matching tile `rounded-xl`, drawn outside the cell bounds. */
function roundedRectPath(r: CellRect, rx = 12): string {
  const x = r.x;
  const y = r.y;
  const w = r.w;
  const h = r.h;
  const cr = Math.min(rx, w / 2, h / 2);
  return [
    `M ${x + cr} ${y}`,
    `H ${x + w - cr}`,
    `Q ${x + w} ${y} ${x + w} ${y + cr}`,
    `V ${y + h - cr}`,
    `Q ${x + w} ${y + h} ${x + w - cr} ${y + h}`,
    `H ${x + cr}`,
    `Q ${x} ${y + h} ${x} ${y + h - cr}`,
    `V ${y + cr}`,
    `Q ${x} ${y} ${x + cr} ${y}`,
    "Z",
  ].join(" ");
}

/** Curved link through the gap (does not cut across tile interiors). */
function gapBridge(
  a: CellRect,
  b: CellRect,
  outset: number,
  player: 1 | 2,
): string {
  const A = inflate(a, outset);
  const B = inflate(b, outset);
  const gc = gapCenter(a, b);
  if (player === 1) {
    const x1 = A.x + A.w;
    const y1 = A.y + A.h;
    const x2 = B.x;
    const y2 = B.y;
    return `M ${x1} ${y1} Q ${gc.x} ${gc.y} ${x2} ${y2}`;
  }
  const x1 = A.x;
  const y1 = A.y + A.h;
  const x2 = B.x + B.w;
  const y2 = B.y;
  return `M ${x1} ${y1} Q ${gc.x} ${gc.y} ${x2} ${y2}`;
}

/**
 * Outset rounded outline around each cell on the line, linked through gaps.
 * Stroke sits in the gutter outside tile faces.
 */
export function connectedGuidePath(
  guide: DiagonalGuideSpec,
  rects: Map<number, CellRect>,
): string | null {
  const chain = orderedRects(guide.indices, rects);
  if (chain.length === 0) return null;

  const outset = chainOutset(chain);
  const parts: string[] = [];

  for (const cell of chain) {
    parts.push(roundedRectPath(inflate(cell, outset)));
  }
  for (let i = 0; i < chain.length - 1; i++) {
    parts.push(gapBridge(chain[i]!, chain[i + 1]!, outset, guide.player));
  }

  return parts.join(" ");
}
