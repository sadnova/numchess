import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "ghost" | "outline" | "secondary";

const styles: Record<Variant, string> = {
  default:
    "bg-accent-action hover:opacity-95 text-white border border-accent-rows/30 shadow-sm",
  secondary:
    "bg-surface-1 hover:bg-surface-2 text-text-primary border border-border-subtle shadow-sm",
  ghost: "bg-transparent hover:bg-surface-2 border border-transparent text-text-primary",
  outline:
    "bg-transparent border border-border-subtle hover:bg-surface-2 text-text-primary",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-rows",
        "disabled:opacity-40 disabled:pointer-events-none",
        styles[variant],
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export function modeToggleClass(active: boolean) {
  return cn(
    "px-3 py-1 rounded-lg border text-sm transition",
    active
      ? "bg-accent-rows-soft border-accent-rows/40 text-text-primary font-medium"
      : "border-border-subtle text-text-muted hover:bg-surface-2",
  );
}

export function chipToggleClass(active: boolean) {
  return cn(
    "px-2 py-0.5 rounded border text-xs capitalize transition",
    active
      ? "bg-accent-rows-soft border-accent-rows/40 text-text-primary"
      : "border-border-subtle text-text-muted hover:bg-surface-2",
  );
}
