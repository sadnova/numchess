import { getScoringLines, type Perspective } from "@numchess/engine";

export function findLineIndices(lineId: string): number[] | undefined {
  for (const p of ["rows", "columns"] as Perspective[]) {
    const hit = getScoringLines(p).find((l) => l.id === lineId);
    if (hit) return hit.indices;
  }
  return undefined;
}

export function lineCategory(lineId: string): "row" | "col" | "diag" {
  if (lineId.startsWith("row-")) return "row";
  if (lineId.startsWith("col-")) return "col";
  return "diag";
}
