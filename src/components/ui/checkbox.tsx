import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        onChange={(e) => {
          onCheckedChange?.(e.target.checked);
          onChange?.(e);
        }}
        className={cn(
          "h-4 w-4 rounded border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

Checkbox.displayName = "Checkbox";
