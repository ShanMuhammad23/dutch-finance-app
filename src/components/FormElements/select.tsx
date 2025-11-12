"use client";

import { ChevronUpIcon } from "@/assets/icons";
import { cn } from "@/lib/utils";
import { ChangeEvent, useEffect, useId, useMemo, useState } from "react";

type PropsType = {
  label: string;
  items: { value: string; label: string }[];
  prefixIcon?: React.ReactNode;
  className?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
} & (
  | { placeholder?: string; defaultValue?: string }
  | { placeholder: string; defaultValue?: string }
);

export function Select({
  items,
  label,
  defaultValue,
  placeholder,
  prefixIcon,
  className,
  name,
  required,
  disabled,
  value,
  onValueChange,
}: PropsType) {
  const id = useId();

  const initialValue = useMemo(
    () => value ?? defaultValue ?? (placeholder ? "" : items[0]?.value ?? ""),
    [value, defaultValue, placeholder, items],
  );

  const [selectedValue, setSelectedValue] = useState(initialValue);
  const [isOptionSelected, setIsOptionSelected] = useState(
    initialValue !== "" && initialValue !== undefined,
  );

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
      setIsOptionSelected(value !== "");
    }
  }, [value]);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    setSelectedValue(newValue);
    setIsOptionSelected(newValue !== "");
    onValueChange?.(newValue);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label
        htmlFor={id}
        className="block text-body-sm font-medium text-dark dark:text-white"
      >
        {label}
        {required && <span className="ml-1 text-red">*</span>}
      </label>

      <div className="relative">
        {prefixIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            {prefixIcon}
          </div>
        )}

        <select
          id={id}
          name={name}
          value={selectedValue}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          className={cn(
            "w-full appearance-none rounded-lg border border-stroke bg-transparent px-5.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:focus:border-primary [&>option]:text-dark-5 dark:[&>option]:text-dark-6",
            isOptionSelected && "text-dark dark:text-white",
            prefixIcon && "pl-11.5",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}

          {items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <ChevronUpIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-180" />
      </div>
    </div>
  );
}
