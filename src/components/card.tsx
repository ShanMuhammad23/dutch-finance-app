import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-dark",
        className
      )}
      {...props}
    />
  );
} 