export function tileValueClass(value: number | null): string {
  if (value === null) return "";
  const rings: Record<number, string> = {
    1: "ring-2 ring-sky-400/70 value-pattern-1",
    2: "ring-2 ring-emerald-400/70 value-pattern-2",
    3: "ring-2 ring-amber-400/70 value-pattern-3",
    4: "ring-2 ring-fuchsia-400/70 value-pattern-4",
    5: "ring-2 ring-orange-400/70 value-pattern-5",
    6: "ring-2 ring-rose-400/70 value-pattern-6",
  };
  return rings[value] ?? "";
}
