import type { RefObject } from "react";
import type { Phase } from "@numchess/engine";
import { Button } from "@/components/ui/Button";

export function GameFooter({
  phase,
  fileInputRef,
  importError,
  importToast,
  onUndo,
  onNewGame,
  onReview,
  onExport,
  onCopy,
  onImportClick,
  onImportFile,
}: {
  phase: Phase;
  fileInputRef: RefObject<HTMLInputElement | null>;
  importError: string | null;
  importToast: string | null;
  onUndo: () => void;
  onNewGame: () => void;
  onReview: () => void;
  onExport: () => void;
  onCopy: () => void;
  onImportClick: () => void;
  onImportFile: (file: File) => void;
}) {
  return (
    <footer className="w-full max-w-lg mx-auto space-y-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-wrap gap-2 justify-center text-sm">
        {phase.kind !== "ended" && (
          <>
            <Button variant="secondary" onClick={onUndo}>
              Undo
            </Button>
            <Button variant="secondary" onClick={onNewGame}>
              New game
            </Button>
          </>
        )}
        <Button variant="secondary" onClick={onReview}>
          Review moves
        </Button>
        <Button variant="secondary" data-testid="export-replay" onClick={onExport}>
          Export replay
        </Button>
        <Button variant="secondary" onClick={onCopy}>
          Copy replay
        </Button>
        <Button variant="secondary" onClick={onImportClick}>
          Import replay
        </Button>
        <input
          ref={fileInputRef}
          data-testid="import-replay-input"
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImportFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {importError && (
        <p className="text-red-700 text-sm text-center" role="alert">
          {importError}
        </p>
      )}
      {importToast && (
        <p className="text-emerald-700 text-sm text-center" role="status">
          {importToast}
        </p>
      )}
    </footer>
  );
}
