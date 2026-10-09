import React from "react";
import Select from "react-select";
import { useController } from "react-hook-form";
import type { FieldError } from "react-hook-form";
import { twMerge } from "tailwind-merge";

type Option = { label: string; value: string | number };

type FormSelectProps = {
  control: any;
  name: string;
  label?: string;
  placeholder?: string;
  options: Option[];
  searchIsHidden?: boolean;
  isDisabled?: boolean;
  onValueChange?: (value: string | number | null) => void;
};

function messageFromFieldError(err?: FieldError): string | undefined {
  if (!err) return undefined;
  if (typeof err.message === "string" && err.message) return err.message;
  if (err.root?.message) return err.root.message;
  if (err.types) {
    const first = Object.values(err.types)[0];
    if (typeof first === "string") return first;
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  }
  return undefined;
}

const FormSelect: React.FC<FormSelectProps> = ({
  control,
  name,
  label,
  placeholder,
  options,
  searchIsHidden,
  isDisabled,
  onValueChange,
}) => {
  const { field, fieldState } = useController({ control, name });
  const errorMessage = messageFromFieldError(fieldState.error);
  const hasError = Boolean(errorMessage);

  const coerced =
    field.value === undefined || field.value === null ? null : field.value;
  const selected =
    options.find((o) => String(o.value) === String(coerced)) || null;

  return (
    <div className="mb-4 relative">
      {label ? (
        <label className="block mb-2 text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}
      <Select
        isSearchable={!searchIsHidden}
        isDisabled={isDisabled}
        classNamePrefix="react-select"
        className={twMerge("w-full", hasError ? "border-red-500" : "")}
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : null
        }
        menuPosition="fixed"
        options={options}
        name={name}
        value={selected as any}
        onBlur={field.onBlur}
        onChange={(option: any) => {
          const selectedValue = option ? option.value : null;
          field.onChange(selectedValue);
          onValueChange?.(selectedValue);
        }}
        placeholder={placeholder}
        styles={{
          control: (base: any, state: any) => ({
            ...base,
            backgroundColor: "var(--card)",
            borderColor: hasError
              ? "#ef4444"
              : state.isFocused
                ? "var(--primary)"
                : "var(--border)",
            borderWidth: "1px",
            borderRadius: "var(--radius-md)",
            boxShadow: state.isFocused ? "0 0 0 1px var(--primary)" : "none",
            color: "var(--foreground)",
            "&:hover": {
              borderColor: state.isFocused ? "var(--primary)" : "var(--ring)",
            },
            minHeight: "auto",
          }),
          valueContainer: (base: any) => ({
            ...base,
            color: "var(--foreground)",
          }),
          singleValue: (base: any) => ({
            ...base,
            color: "var(--foreground)",
          }),
          input: (base: any) => ({
            ...base,
            color: "var(--foreground)",
          }),
          placeholder: (base: any) => ({
            ...base,
            color: "var(--muted-foreground)",
          }),
          indicatorSeparator: (base: any) => ({
            ...base,
            backgroundColor: "var(--border)",
          }),
          dropdownIndicator: (base: any, state: any) => ({
            ...base,
            color: state.isFocused ? "var(--primary)" : "var(--muted-foreground)",
            "&:hover": {
              color: "var(--primary)",
            },
          }),
          clearIndicator: (base: any) => ({
            ...base,
            color: "var(--muted-foreground)",
            "&:hover": {
              color: "var(--foreground)",
            },
          }),
          menu: (base: any) => ({
            ...base,
            backgroundColor: "var(--popover)",
            border: "1px solid var(--border)",
            color: "var(--popover-foreground)",
          }),
          option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected
              ? "var(--primary)"
              : state.isFocused
                ? "var(--muted)"
                : "transparent",
            color: state.isSelected ? "var(--primary-foreground)" : "var(--popover-foreground)",
            cursor: "pointer",
          }),
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        }}
      />
      {errorMessage ? (
        <span className="text-xs text-red-600 mt-1 block">{errorMessage}</span>
      ) : null}
    </div>
  );
};

export default FormSelect;
