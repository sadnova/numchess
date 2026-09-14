import type { GameConfig } from "@numchess/engine";
import { useLayoutEffect, useState } from "react";
import {
  getDiagonalGuideSpecs,
  type DiagonalGuideSpec,
} from "@/lib/diagonalGuides";
import {
  connectedGuidePath,
  type CellRect,
} from "@/lib/diagonalGuideOutline";

function useCellRects(
  gridEl: HTMLDivElement | null,
  cellCount: number,
): Map<number, CellRect> {
  const [rects, setRects] = useState<Map<number, CellRect>>(() => new Map());

  useLayoutEffect(() => {
    if (!gridEl) return;

    const measure = () => {
      const box = gridEl.getBoundingClientRect();
      const next = new Map<number, CellRect>();
      for (let i = 0; i < cellCount; i++) {
        const cell = gridEl.querySelector(`[data-testid="cell-${i}"]`);
        if (!cell) continue;
        const r = cell.getBoundingClientRect();
        next.set(i, {
          x: r.left - box.left,
          y: r.top - box.top,
          w: r.width,
          h: r.height,
        });
      }
      setRects(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(gridEl);
    return () => ro.disconnect();
  }, [gridEl, cellCount]);

  return rects;
}

function GuideRibbon({
  guide,
  rects,
  boardSize,
}: {
  guide: DiagonalGuideSpec;
  rects: Map<number, CellRect>;
  boardSize: number;
}) {
  const d = connectedGuidePath(guide, rects, boardSize);
  if (!d) return null;

  const isP1 = guide.player === 1;
  const stroke = isP1
    ? "var(--color-accent-rows)"
    : "var(--color-accent-cols)";
  const isMain = guide.role === "main";
  const dash = isMain ? undefined : "8 5";
  const w = isMain ? 1.75 : 1.35;
  const halo = 1.5;

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="white"
        strokeWidth={w + halo}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dash}
        opacity={0.9}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dash}
        opacity={0.92}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

export function DiagonalGuidesOverlay({
  gridEl,
  cellCount,
  config,
}: {
  gridEl: HTMLDivElement;
  cellCount: number;
  config: GameConfig;
}) {
  const rects = useCellRects(gridEl, cellCount);
  const guides = getDiagonalGuideSpecs(config);

  if (rects.size < cellCount) return null;

  const w = gridEl.clientWidth;
  const h = gridEl.clientHeight;
  if (w === 0 || h === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-[4] overflow-visible"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden
    >
      {guides.map((g) => (
        <GuideRibbon
          key={g.id}
          guide={g}
          rects={rects}
          boardSize={config.boardSize}
        />
      ))}
    </svg>
  );
}

export function DiagonalGuidesLegend({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <p
      className="text-[10px] text-text-muted text-center mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 px-2"
      aria-label="Diagonal guide legend"
    >
      <span className="inline-flex items-center gap-1.5">
        <span
          className="w-4 h-4 rounded-md border-[1.5px] shrink-0"
          style={{ borderColor: "var(--color-accent-rows)" }}
        />
        <span>P1 ↘ · outline around cells (solid = main)</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="w-4 h-4 rounded-md border-[1.5px] border-dashed shrink-0"
          style={{ borderColor: "var(--color-accent-cols)" }}
        />
        <span>P2 ↙ · dashed flanks</span>
      </span>
    </p>
  );
}
