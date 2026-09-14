import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { NumchessLogo } from "@/components/NumchessLogo";
import { RulesDialog } from "@/components/RulesDialog";
import { Button } from "@/components/ui/Button";

const STEPS = [
  {
    step: 1,
    title: "Pick a number",
    body: "On your turn, click a tile value in your inventory (P1 rows, P2 columns).",
  },
  {
    step: 2,
    title: "Place on the board",
    body: "Click any empty cell to play that number on the shared 6×6 grid.",
  },
  {
    step: 3,
    title: "Win by levels",
    body: "When the board is full, compare Level 5→2 counts from your scoring lines.",
  },
] as const;

export function HomePage() {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <div
      data-testid="home-page"
      className="min-h-full bg-bg-page text-text-primary home-grid-bg"
    >
      <main
        id="main-content"
        tabIndex={-1}
        className="max-w-2xl mx-auto px-6 py-10 sm:py-16 flex flex-col gap-10 outline-none"
      >
        <header className="text-center space-y-5">
          <div className="flex justify-center pt-2">
            <div className="relative">
              <div
                className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-accent-rows/20 via-transparent to-accent-cols/25 blur-2xl opacity-80"
                aria-hidden
              />
              <NumchessLogo
                variant="hero"
                className="relative h-36 w-36 sm:h-44 sm:w-44 drop-shadow-[0_16px_40px_oklch(0.22_0.04_260/0.15)]"
              />
            </div>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-rows">
            Abstract · 6×6 · Two players
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-balance">
            Numchess Ultimate
          </h1>
          <p className="text-base sm:text-lg text-text-muted max-w-lg mx-auto leading-relaxed">
            One shared board. Player 1 owns rows and three ↘ lines; Player 2 owns columns and three ↙ lines.
            Pattern levels—not tile values—decide the winner.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link to="/play" data-testid="play-link">
              <Button className="w-full sm:w-auto gap-2 px-6 py-2.5 text-base">
                Play Classic
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setRulesOpen(true)}
            >
              <BookOpen className="h-4 w-4" aria-hidden />
              How scoring works
            </Button>
          </div>
        </header>

        <section
          className="rounded-2xl border border-border-subtle bg-surface-1/90 p-6 shadow-[var(--shadow-panel)]"
          aria-labelledby="how-it-works"
        >
          <h2
            id="how-it-works"
            className="font-display text-xl font-semibold text-center mb-6"
          >
            How a turn works
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map(({ step, title, body }) => (
              <li
                key={step}
                className="relative rounded-xl border border-border-subtle bg-surface-2/80 p-4 text-left"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-rows text-white text-sm font-bold tile-num mb-3">
                  {step}
                </span>
                <h3 className="font-semibold text-text-primary mb-1">{title}</h3>
                <p className="text-sm text-text-muted leading-snug">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="text-center text-xs text-text-muted space-y-1 pb-4">
          <p>Pass-and-play on one device · Vs bot · Replay export</p>
          <p>Install as a PWA for offline play after your first visit.</p>
        </footer>
      </main>
      <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
