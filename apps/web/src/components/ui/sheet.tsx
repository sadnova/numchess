import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  );
}

export function SheetContent({
  className,
  children,
  title,
  ...props
}: DialogPrimitive.DialogContentProps & { title: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 max-h-[min(85vh,520px)] overflow-y-auto",
          "rounded-t-2xl border border-border-subtle bg-surface-1 p-6 shadow-panel",
          "focus:outline-none",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between mb-4">
          <DialogPrimitive.Title className="text-lg font-semibold font-display text-text-primary">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close className="rounded-md p-1 text-text-muted hover:text-text-primary hover:bg-surface-2">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
