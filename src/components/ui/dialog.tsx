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

type DialogContextType = {
  isOpen: boolean;
  handleOpen: () => void;
  handleClose: () => void;
};

const DialogContext = createContext<DialogContextType | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialogContext must be used within a Dialog");
  }
  return context;
}

type DialogProps = {
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function Dialog({ children, isOpen, onOpenChange }: DialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  const handleOpen = () => {
    onOpenChange(true);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.removeProperty("overflow");
    }

    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      handleClose();
    }
  };

  return (
    <DialogContext.Provider value={{ isOpen, handleOpen, handleClose }}>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onKeyDown={handleKeyDown}
        >
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70" />
          {children}
        </div>
      )}
    </DialogContext.Provider>
  );
}

type DialogContentProps = {
  className?: string;
  children: React.ReactNode;
};

export function DialogContent({
  children,
  className,
}: DialogContentProps) {
  const { isOpen, handleClose } = useDialogContext();
  const contentRef = useClickOutside<HTMLDivElement>(() => {
    if (isOpen) handleClose();
  });

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      role="dialog"
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

type DialogHeaderProps = {
  children: React.ReactNode;
  className?: string;
};

export function DialogHeader({ children, className }: DialogHeaderProps) {
  const { handleClose } = useDialogContext();

  return (
    <div className={cn("mb-4 flex items-start justify-between", className)}>
      <div className="flex-1">{children}</div>
      <button
        onClick={handleClose}
        className="ml-4 rounded-lg p-1 text-dark-6 transition hover:bg-gray-2 hover:text-dark dark:text-dark-6 dark:hover:bg-dark-3 dark:hover:text-white"
        aria-label="Close dialog"
      >
        <XIcon className="size-5" />
      </button>
    </div>
  );
}

type DialogTitleProps = {
  children: React.ReactNode;
  className?: string;
};

export function DialogTitle({ children, className }: DialogTitleProps) {
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

type DialogDescriptionProps = {
  children: React.ReactNode;
  className?: string;
};

export function DialogDescription({
  children,
  className,
}: DialogDescriptionProps) {
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

type DialogFooterProps = {
  children: React.ReactNode;
  className?: string;
};

export function DialogFooter({ children, className }: DialogFooterProps) {
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

