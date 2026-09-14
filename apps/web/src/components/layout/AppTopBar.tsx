import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type AppTopBarProps = {
  onOpenRules: () => void;
  onOpenSettings: () => void;
  resumeNote?: ReactNode;
  modeControls: ReactNode;
  sandboxBanner?: ReactNode;
};

export function AppTopBar({
  onOpenRules,
  onOpenSettings,
  resumeNote,
  modeControls,
  sandboxBanner,
}: AppTopBarProps) {
  return (
    <header className="w-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link
          to="/"
          className="text-xs text-text-muted underline hover:text-text-primary shrink-0 pt-1"
        >
          Home
        </Link>
        <div className="flex-1 text-center min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-display text-text-primary truncate">
            Numchess Ultimate
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5 hidden sm:block">
            P1 rows · P2 columns · shared diagonals
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            className="px-2 py-1.5 text-xs h-auto"
            onClick={onOpenRules}
          >
            Rules
          </Button>
          <Button
            variant="ghost"
            className="px-2 py-1.5 h-auto"
            aria-label="Match settings"
            onClick={onOpenSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {resumeNote}
      <div className={cn("flex justify-center")}>{modeControls}</div>
      {sandboxBanner}
    </header>
  );
}
