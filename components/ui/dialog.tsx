"use client";

import { Dialog as HeadlessDialog, DialogPanel, DialogTitle as HeadlessDialogTitle, Description } from "@headlessui/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Dialog({ open, onClose, children }: { open: boolean; onClose: (open: boolean) => void; children: ReactNode }) {
  return (
    <HeadlessDialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-foreground/20 transition-opacity" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {children}
      </div>
    </HeadlessDialog>
  );
}

export function DialogContent({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <DialogPanel className={cn("w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl", className)}>
      {children}
    </DialogPanel>
  );
}

export function DialogHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mb-5 space-y-1.5", className)}>{children}</div>;
}

export function DialogTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <HeadlessDialogTitle className={cn("text-xl font-semibold", className)}>{children}</HeadlessDialogTitle>;
}

export function DialogDescription({ className, children }: { className?: string; children: ReactNode }) {
  return <Description className={cn("text-sm text-muted-foreground", className)}>{children}</Description>;
}
