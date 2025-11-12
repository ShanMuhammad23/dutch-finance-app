import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white shadow-sm dark:border-dark-3 dark:bg-dark-2",
        className,
      )}
      {...props}
    />
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div
      className={cn(
        "p-6",
        className,
      )}
      {...props}
    />
  );
}