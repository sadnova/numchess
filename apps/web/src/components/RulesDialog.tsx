import type { BoardMode } from "@/lib/persistence";
import { Button } from "./ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";

export function RulesDialog({
  open,
  boardMode,
  onClose,
}: {
  open: boolean;
  boardMode: BoardMode;
  onClose: () => void;
}) {
  const title =
    boardMode === "strategic"
      ? "Strategic rules (summary)"
      : "Classic rules (summary)";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent aria-describedby="rules-desc">
        <DialogTitle className="text-lg font-bold font-display text-text-primary">
          {title}
        </DialogTitle>
        {boardMode === "classic" ? (
          <ul
            id="rules-desc"
            className="text-sm space-y-2 text-text-primary list-disc pl-5 mt-2"
          >
            <li>6×6 shared board; 36 placements total.</li>
            <li>
              P1 (Rows) scores each row plus three ↘ diagonals (one main, two
              5-cell flanks); P2 (Cols) scores each column plus three ↙
              diagonals.
            </li>
            <li>
              Live score counts pattern levels on partial lines (filled cells
              only). At game end, rows/cols/main diags need 6 filled cells;
              flank diags need 5.
            </li>
            <li>
              Each line awards repetition (R) and diversity (D) levels when R≥2
              and D≥2 (both can apply on the same line).
            </li>
            <li>
              Winner: compare L5, then L4, L3, L2 counts (rows vs columns). Full
              tie = draw.
            </li>
          </ul>
        ) : (
          <ul
            id="rules-desc"
            className="text-sm space-y-2 text-text-primary list-disc pl-5 mt-2"
          >
            <li>8×8 shared board; 64 placements; tile values 1–6.</li>
            <li>
              P1 scores 8 rows plus five ↘ diagonals; P2 scores 8 columns plus
              five ↙ diagonals (lengths 8 / 7 / 7 / 6 / 6).
            </li>
            <li>
              Contributions start at Level 3: repetition and diversity need R≥3
              and D≥3 on a line (cap Level 6).
            </li>
            <li>
              Winner: compare L6, then L5, L4, L3 (rows vs columns). No Level 2
              band. Full tie = draw.
            </li>
            <li>
              Switch board mode with Classic / Strategic before starting a new
              game.
            </li>
          </ul>
        )}
        <DialogDescription className="sr-only">
          Summary of Numchess scoring and win conditions for the selected board
          mode.
        </DialogDescription>
        <p className="text-xs text-text-muted">
          Full rules:{" "}
          <code className="text-accent-rows">
            docs/{boardMode === "strategic" ? "RULES_STRATEGIC.md" : "RULES.md"}
          </code>{" "}
          in the repo.
        </p>
        <Button className="w-full mt-2" onClick={onClose}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
