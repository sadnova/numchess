import { useEffect, useState } from "react";

export function MatchClock({
  enabled,
  limitSec,
  ply,
  active,
}: {
  enabled: boolean;
  limitSec: number;
  ply: number;
  active: boolean;
}) {
  const [left, setLeft] = useState(limitSec);

  useEffect(() => {
    if (!enabled || !active) return;
    setLeft(limitSec);
    const iv = window.setInterval(() => {
      setLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(iv);
  }, [enabled, limitSec, ply, active]);

  if (!enabled) return null;

  return (
    <p
      className={`text-xs tile-num ${left <= 10 ? "text-red-700" : "text-text-muted"}`}
      aria-live="polite"
    >
      Arena clock: {left}s
    </p>
  );
}
