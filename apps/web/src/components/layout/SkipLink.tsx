export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-surface-1 focus:border focus:border-border-subtle focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-text-primary focus:shadow-[var(--shadow-panel)]"
      onClick={(e) => {
        e.preventDefault();
        const main = document.getElementById("main-content");
        main?.focus({ preventScroll: false });
        main?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      Skip to main content
    </a>
  );
}
