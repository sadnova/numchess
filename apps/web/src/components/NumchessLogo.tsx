import { cn } from "@/lib/utils";

const ORIGIN = 82;
const CELL = 54;
const GAP = 7;
const R = 13;

function cellPos(row: number, col: number) {
  return {
    x: ORIGIN + col * (CELL + GAP),
    y: ORIGIN + row * (CELL + GAP),
  };
}

function diagonalColor(i: number) {
  const t = i / 5;
  const r = Math.round(47 + t * (196 - 47));
  const g = Math.round(106 + t * (125 - 106));
  const b = Math.round(174 + t * (58 - 174));
  return `rgb(${r},${g},${b})`;
}

type NumchessLogoProps = {
  className?: string;
  variant?: "hero" | "mark";
};

export function NumchessLogo({
  className,
  variant = "hero",
}: NumchessLogoProps) {
  const detailed = variant === "hero";
  const gridEnd = ORIGIN + 6 * CELL + 5 * GAP;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      role="img"
      aria-label="Numchess"
      className={cn("select-none", className)}
    >
      <defs>
        <linearGradient id="nc-shell" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e9eef7" />
        </linearGradient>
        <linearGradient id="nc-panel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f8fafd" />
          <stop offset="100%" stopColor="#edf1f9" />
        </linearGradient>
        <filter id="nc-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy={detailed ? 14 : 8}
            stdDeviation={detailed ? 18 : 10}
            floodColor="#152033"
            floodOpacity="0.14"
          />
        </filter>
        <filter id="nc-chip" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1a2840" floodOpacity="0.12" />
        </filter>
        <linearGradient id="nc-diag-line" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3d6eae" />
          <stop offset="100%" stopColor="#c47d28" />
        </linearGradient>
      </defs>

      <rect
        width="512"
        height="512"
        rx="116"
        fill="url(#nc-shell)"
        filter="url(#nc-shadow)"
      />
      <rect
        x="14"
        y="14"
        width="484"
        height="484"
        rx="102"
        fill="none"
        stroke="#c5d2e6"
        strokeWidth="2"
      />

      {/* felt panel */}
      <rect
        x={ORIGIN - 18}
        y={ORIGIN - 18}
        width={gridEnd - ORIGIN + 36}
        height={gridEnd - ORIGIN + 36}
        rx="28"
        fill="url(#nc-panel)"
        stroke="#d4deec"
        strokeWidth="2"
      />

      {/* soft row / column ownership (inside panel) */}
      {detailed && (
        <>
          <rect
            x={ORIGIN - 8}
            y={cellPos(2, 0).y - 4}
            width={gridEnd - ORIGIN + 16}
            height={CELL + 8}
            rx="10"
            fill="#3d6eae"
            opacity="0.08"
          />
          <rect
            x={cellPos(0, 3).x - 4}
            y={ORIGIN - 8}
            width={CELL + 8}
            height={gridEnd - ORIGIN + 16}
            rx="10"
            fill="#c47d28"
            opacity="0.08"
          />
        </>
      )}

      {/* diagonal connector (under chips) */}
      <path
        d={`M ${cellPos(0, 0).x + CELL / 2} ${cellPos(0, 0).y + CELL / 2} L ${cellPos(5, 5).x + CELL / 2} ${cellPos(5, 5).y + CELL / 2}`}
        fill="none"
        stroke="url(#nc-diag-line)"
        strokeWidth={detailed ? 3 : 4}
        strokeLinecap="round"
        opacity="0.35"
      />

      {/* grid cells */}
      {Array.from({ length: 6 }, (_, row) =>
        Array.from({ length: 6 }, (_, col) => {
          const { x, y } = cellPos(row, col);
          const onDiag = row === col;
          const chipFill = onDiag ? diagonalColor(row) : "#ffffff";
          const stroke = onDiag ? "none" : "#dfe6f2";
          return (
            <g key={`${row}-${col}`}>
              <rect
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={R}
                fill={chipFill}
                stroke={stroke}
                strokeWidth={onDiag ? 0 : 1.5}
                filter={onDiag ? "url(#nc-chip)" : undefined}
              />
              {onDiag && (
                <>
                  <rect
                    x={x + 4}
                    y={y + 4}
                    width={CELL - 8}
                    height={CELL - 8}
                    rx={R - 4}
                    fill="white"
                    fillOpacity="0.22"
                  />
                  <text
                    x={x + CELL / 2}
                    y={y + CELL / 2 + (detailed ? 1 : 0)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily="Segoe UI, system-ui, sans-serif"
                    fontSize={detailed ? 26 : 22}
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    {row + 1}
                  </text>
                </>
              )}
            </g>
          );
        }),
      )}
    </svg>
  );
}
