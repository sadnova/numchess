import { Button } from "./ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";

export function RulesDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent aria-describedby="rules-desc">
        <DialogTitle className="text-lg font-bold font-display text-text-primary">
          Classic rules (summary)
        </DialogTitle>
        <ul
          id="rules-desc"
          className="text-sm space-y-2 text-text-primary list-disc pl-5 mt-2"
        >
            <li>6×6 shared board; 36 placements total.</li>
            <li>
              P1 scores each row and both main diagonals; P2 scores each column
              and both diagonals.
            </li>
            <li>
              Each full line awards repetition (R) and diversity (D) levels when
              thresholds are met (coexist on the same line).
            </li>
            <li>
              Winner: compare L5, then L4, L3, L2 counts (rows vs columns). Full
              tie = draw.
            </li>
          </ul>
        <DialogDescription className="sr-only">
          Summary of Numchess Classic scoring and win conditions.
        </DialogDescription>
        <p className="text-xs text-text-muted">
          Full rules: see <code className="text-accent-rows">docs/RULES.md</code>{" "}
          in the repo.
        </p>
        <Button className="w-full mt-2" onClick={onClose}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
