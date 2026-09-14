import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function usePlayTutorial(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (new URLSearchParams(window.location.search).has("noTutorial")) return;
    const key = "numchess-tutorial-done";
    if (localStorage.getItem(key)) return;

    const d = driver({
      showProgress: true,
      overlayColor: "rgba(15, 23, 42, 0.35)",
      popoverClass: "numchess-driver",
      steps: [
        {
          element: "[data-testid='inventory-p1']",
          popover: {
            title: "Step 1 — Pick a number",
            description:
              "Click one of the tiles in Player 1’s inventory (rows player goes first in a new game).",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "[data-testid='app-board']",
          popover: {
            title: "Step 2 — Place on the grid",
            description:
              "Click an empty square highlighted on the board to play your number.",
            side: "top",
            align: "center",
          },
        },
      ],
      onDestroyStarted: () => {
        localStorage.setItem(key, "1");
        d.destroy();
      },
    });
    const t = window.setTimeout(() => d.drive(), 600);
    return () => window.clearTimeout(t);
  }, [enabled]);
}
