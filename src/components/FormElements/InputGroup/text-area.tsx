import { cn } from "@/lib/utils";
import { ChangeEvent, useId } from "react";

interface PropsType {
  label: string;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  icon?: React.ReactNode;
  defaultValue?: string;
  value?: string;
  name?: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
}

export function TextAreaGroup({
  label,
  placeholder,
  required,
  disabled,
  active,
  className,
  icon,
  defaultValue,
  value,
  name,
  onChange,
  rows = 6,
}: PropsType) {
  const id = useId();

  const isControlled = value !== undefined;

  return (
    <div className={cn(className)}>
      <label
        htmlFor={id}
        className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
      >
        {label}
        {required && <span className="ml-1 text-red">*</span>}
      </label>

      <div className="relative mt-3 [&_svg]:pointer-events-none [&_svg]:absolute [&_svg]:left-5.5 [&_svg]:top-5.5">
        <textarea
          id={id}
          name={name}
          rows={rows}
          placeholder={placeholder}
          {...(isControlled
            ? { value, onChange }
            : { defaultValue, onChange })}
          className={cn(
            "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary disabled:cursor-default disabled:bg-gray-2 data-[active=true]:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary dark:disabled:bg-dark dark:data-[active=true]:border-primary",
            icon && "py-5 pl-13 pr-5",
            disabled && "cursor-not-allowed opacity-60",
          )}
          required={required}
          disabled={disabled}
          data-active={active}
        />

        {icon}
      </div>
    </div>
  );
}
