import { cn } from "@/lib/utils";
import {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  forwardRef,
} from "react";

type Variant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type Size = "default" | "sm" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  default:
    "bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive",
  outline:
    "border border-input bg-transparent hover:bg-muted focus-visible:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-dark-3",
  secondary:
    "bg-muted text-foreground hover:bg-muted/80 focus-visible:ring-muted dark:bg-dark-3 dark:text-dark-8",
  ghost:
    "bg-transparent hover:bg-muted focus-visible:ring-muted dark:text-dark-6 dark:hover:bg-dark-3",
  link: "bg-transparent underline-offset-4 hover:underline focus-visible:ring-transparent",
};

const sizeClasses: Record<Size, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3 text-sm",
  lg: "h-11 px-5 text-base",
  icon: "h-10 w-10",
};

export interface ButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-dark",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

