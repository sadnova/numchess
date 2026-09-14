import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PlayLayoutProps = {
  topBar: ReactNode;
  leftRail: ReactNode;
  rightRail: ReactNode;
  turnBanner: ReactNode;
  board: ReactNode;
  belowBoard: ReactNode;
  footer: ReactNode;
  className?: string;
  "data-testid"?: string;
};

export function PlayLayout({
  topBar,
  leftRail,
  rightRail,
  turnBanner,
  board,
  belowBoard,
  footer,
  className,
  "data-testid": testId = "app-shell",
}: PlayLayoutProps) {
  return (
    <div
      data-testid={testId}
      className={cn("min-h-full bg-bg-page text-text-primary", className)}
    >
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-4">
        {topBar}

        <main
          id="main-content"
          tabIndex={-1}
          className="outline-none flex flex-col gap-4 min-w-0"
        >
          <div
            className={cn(
              "grid gap-4 items-start",
              "lg:grid-cols-[minmax(11rem,1fr)_minmax(280px,420px)_minmax(11rem,1fr)]",
              "lg:grid-rows-[auto_auto_1fr]",
            )}
          >
            <div className="flex flex-wrap gap-4 justify-center lg:contents">
              <div className="lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-4">
                {leftRail}
              </div>
              <div className="lg:col-start-3 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-4">
                {rightRail}
              </div>
            </div>

            <div
              className={cn(
                "flex flex-col items-center gap-3 lg:col-start-2 lg:row-start-1",
                "sticky top-0 z-10 -mx-4 px-4 py-2 lg:static lg:mx-0 lg:px-0 lg:py-0",
                "bg-bg-page/95 backdrop-blur-sm border-b border-border-subtle/80 lg:border-0",
              )}
            >
              {turnBanner}
            </div>

            <div className="flex flex-col items-center gap-3 lg:col-start-2 lg:row-start-2">
              {board}
              {belowBoard}
            </div>
          </div>

          {footer}
        </main>
      </div>
    </div>
  );
}
