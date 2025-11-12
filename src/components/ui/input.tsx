import { cn } from "@/lib/utils";
import {
  DetailedHTMLProps,
  InputHTMLAttributes,
  forwardRef,
} from "react";

export type InputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:placeholder:text-dark-6 dark:focus-visible:ring-offset-dark",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

