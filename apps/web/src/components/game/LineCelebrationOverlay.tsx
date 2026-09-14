import { useLayoutEffect, useState } from "react";
import type { LineCelebrationEvent } from "@/lib/lineCelebration";

type CellRect = { x: number; y: number; w: number; h: number };

function useCellRects(gridEl: HTMLDivElement | null): Map<number, CellRect> {
  const [rects, setRects] = useState<Map<number, CellRect>>(() => new Map());

  useLayoutEffect(() => {
    if (!gridEl) return;

    const measure = () => {
      const box = gridEl.getBoundingClientRect();
      const next = new Map<number, CellRect>();
      for (let i = 0; i < 36; i++) {
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
  }, [gridEl]);

  return rects;
}

function L5CellFx({
  rect,
  player,
  stagger,
}: {
  rect: CellRect;
  player: 1 | 2;
  stagger: number;
}) {
  const isRows = player === 1;
  const accent = isRows ? "var(--color-accent-rows)" : "var(--color-accent-cols)";
  const soft = isRows
    ? "var(--color-accent-rows-soft)"
    : "var(--color-accent-cols-soft)";
  const delay = `${stagger * 65}ms`;

  return (
    <div
      className="absolute"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
      }}
    >
      <div
        className="absolute inset-0 rounded-xl motion-safe:animate-[line-celebrate-l5-ring_1.25s_ease-out_forwards]"
        style={{
          animationDelay: delay,
          border: `2px solid ${accent}`,
          boxShadow: `0 0 12px 2px color-mix(in oklch, ${accent} 45%, transparent)`,
        }}
      />
      <div
        className="absolute inset-0 rounded-xl motion-safe:animate-[line-celebrate-l5-shimmer_1.2s_ease-out_forwards]"
        style={{
          animationDelay: delay,
          background: `radial-gradient(circle at 50% 50%, color-mix(in oklch, ${accent} 35%, transparent), transparent 70%)`,
        }}
      />
      <div
        className="absolute inset-0 rounded-xl motion-safe:animate-[line-celebrate-l5_1.25s_cubic-bezier(0.22,1,0.36,1)_forwards]"
        style={{
          animationDelay: delay,
          background: soft,
          boxShadow: `
            inset 0 0 0 3px color-mix(in oklch, ${accent} 90%, white),
            0 0 20px 4px color-mix(in oklch, ${accent} 40%, transparent)
          `,
        }}
      />
    </div>
  );
}

export function LineCelebrationOverlay({
  gridEl,
  events,
  reduceMotion,
}: {
  gridEl: HTMLDivElement | null;
  events: LineCelebrationEvent[];
  reduceMotion: boolean;
}) {
  const rects = useCellRects(gridEl);

  if (reduceMotion || events.length === 0 || !gridEl) return null;

  const byIndex = new Map<
    number,
    { level: 4 | 5; player: 1 | 2; stagger: number }
  >();
  for (const ev of events) {
    ev.indices.forEach((index, i) => {
      const prev = byIndex.get(index);
      const next = { level: ev.level, player: ev.player, stagger: i };
      if (!prev || next.level > prev.level) {
        byIndex.set(index, next);
      }
    });
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[3] overflow-visible rounded-2xl"
      aria-hidden="true"
      data-testid="line-celebration-overlay"
    >
      {[...byIndex.entries()].map(([index, meta]) => {
        const rect = rects.get(index);
        if (!rect) return null;

        if (meta.level === 5) {
          return (
            <L5CellFx
              key={`${index}-l5`}
              rect={rect}
              player={meta.player}
              stagger={meta.stagger}
            />
          );
        }

        const isRows = meta.player === 1;
        return (
          <div
            key={`${index}-l4`}
            className="absolute rounded-xl motion-safe:animate-[line-celebrate_1s_ease-out_forwards]"
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.w,
              height: rect.h,
              animationDelay: `${meta.stagger * 55}ms`,
              boxShadow: isRows
                ? "inset 0 0 0 2px var(--color-accent-rows)"
                : "inset 0 0 0 2px var(--color-accent-cols)",
            }}
          />
        );
      })}
    </div>
  );
}
