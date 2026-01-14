"use client";

import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/utils";
import { XIcon } from "@/assets/icons";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
} from "react";

type AlertDialogContextType = {
  isOpen: boolean;
  handleOpen: () => void;
  handleClose: () => void;
};

const AlertDialogContext = createContext<AlertDialogContextType | null>(null);

function useAlertDialogContext() {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error("useAlertDialogContext must be used within an AlertDialog");
  }
  return context;
}

type AlertDialogProps = {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AlertDialog({ children, open, onOpenChange }: AlertDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  const handleOpen = () => {
    onOpenChange(true);
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.removeProperty("overflow");
    }

    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [open]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      handleClose();
    }
  };

  return (
    <AlertDialogContext.Provider value={{ isOpen: open, handleOpen, handleClose }}>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onKeyDown={handleKeyDown}
        >
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70" />
          {children}
        </div>
      )}
    </AlertDialogContext.Provider>
  );
}

type AlertDialogContentProps = {
  className?: string;
  children: React.ReactNode;
};

export function AlertDialogContent({
  children,
  className,
}: AlertDialogContentProps) {
  const { isOpen } = useAlertDialogContext();
  const contentRef = useClickOutside<HTMLDivElement>(() => {
    // Don't close on outside click for alert dialogs
  });

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      role="alertdialog"
      aria-modal="true"
      className={cn(
        "relative z-50 w-full max-w-lg rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AlertDialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
}

export function AlertDialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        "text-xl font-semibold text-dark dark:text-white",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function AlertDialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "mt-2 text-sm text-dark-6 dark:text-dark-6",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function AlertDialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AlertDialogCancel({ children, className, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { handleClose } = useAlertDialogContext();
  
  return (
    <button
      onClick={handleClose}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-lg border border-dark/20 bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-2 disabled:opacity-50 dark:border-white/25 dark:bg-gray-dark dark:text-white dark:hover:bg-dark-3",
        className,
      )}
      {...props}
    >
      {children || "Cancel"}
    </button>
  );
}

export function AlertDialogAction({ children, className, onClick, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { handleClose } = useAlertDialogContext();
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    }
    // Don't auto-close, let the parent handle it
  };
  
  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

