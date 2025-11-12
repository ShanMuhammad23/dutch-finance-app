import { cn } from "@/lib/utils";
import {
  DetailedHTMLProps,
  LabelHTMLAttributes,
  forwardRef,
} from "react";

export type LabelProps = DetailedHTMLProps<
  LabelHTMLAttributes<HTMLLabelElement>,
  HTMLLabelElement
>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className,
        )}
        {...props}
      />
    );
  },
);

Label.displayName = "Label";

