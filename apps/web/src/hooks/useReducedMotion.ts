import { useEffect, useState } from "react";

/** User setting OR system prefers-reduced-motion. */
export function useReducedMotion(preferReducedFromSettings: boolean): boolean {
  const [systemReduced, setSystemReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setSystemReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const reduced = preferReducedFromSettings || systemReduced;
    document.documentElement.classList.toggle("reduce-motion", reduced);
    return () => document.documentElement.classList.remove("reduce-motion");
  }, [preferReducedFromSettings, systemReduced]);

  return preferReducedFromSettings || systemReduced;
}
