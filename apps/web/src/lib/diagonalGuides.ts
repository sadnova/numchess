import { getScoringLines } from "@numchess/engine";

export type DiagonalGuideSpec = {
  id: string;
  label: string;
  indices: number[];
  player: 1 | 2;
  role: "main" | "flank";
};

/** All six scoring diagonals (3 per player) for board visualization. */
export function getDiagonalGuideSpecs(): DiagonalGuideSpec[] {
  const rowDiags = getScoringLines("rows").filter((l) => l.id.startsWith("diag-"));
  const colDiags = getScoringLines("columns").filter((l) =>
    l.id.startsWith("diag-"),
  );
  return [
    ...rowDiags.map((l) => ({
      id: l.id,
      label: l.label,
      indices: l.indices,
      player: 1 as const,
      role: (l.id === "diag-se" ? "main" : "flank") as "main" | "flank",
    })),
    ...colDiags.map((l) => ({
      id: l.id,
      label: l.label,
      indices: l.indices,
      player: 2 as const,
      role: (l.id === "diag-sw" ? "main" : "flank") as "main" | "flank",
    })),
  ];
}
