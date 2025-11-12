import { cn } from "@/lib/utils";
import { ChangeEvent, useId } from "react";

type PropsType = {
  variant?: "dot" | "circle";
  label: string;
  name?: string;
  value?: string;
  minimal?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
};

export function RadioInput({
  label,
  variant = "dot",
  name,
  value,
  minimal,
  checked,
  defaultChecked,
  onChange,
  disabled,
}: PropsType) {
  const id = useId();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    onChange?.(event.target.value, event);
  };

  return (
    <div>
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer select-none items-center text-body-sm font-medium text-dark dark:text-white",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <div className="relative">
          <input
            type="radio"
            name={name}
            id={id}
            className="peer sr-only"
            value={value}
            onChange={handleChange}
            checked={checked}
            defaultChecked={checked === undefined ? defaultChecked : undefined}
            disabled={disabled}
          />
          <div
            className={cn(
              "mr-2 flex size-5 items-center justify-center rounded-full border peer-checked:[&>*]:block",
              {
                "border-primary peer-checked:border-6": variant === "circle",
                "border-dark-5 peer-checked:border-primary peer-checked:bg-gray-2 dark:border-dark-6 dark:peer-checked:bg-dark-2":
                  variant === "dot",
              },
              minimal && "border-stroke dark:border-dark-3",
              disabled && "opacity-70",
            )}
          >
            <span
              className={cn(
                "hidden size-2.5 rounded-full bg-primary",
                variant === "circle" && "bg-transparent",
              )}
            />
          </div>
        </div>
        <span>{label}</span>
      </label>
    </div>
  );
}
