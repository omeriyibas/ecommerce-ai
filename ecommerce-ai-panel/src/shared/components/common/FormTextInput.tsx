import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { cn } from "@/lib/utils.ts";

type FormTextInputProps<T extends FieldValues = FieldValues> = {
  handleBlur?: (name: string, touched: boolean) => void;
  label: string;
  name: FieldPath<T>;
  control: Control<T>;
  placeholder?: string;
  rowCount?: number;
  touched?: boolean;
  disabled?: boolean;
  type?: string;
  id?: string;
};

function FormTextInput<T extends FieldValues = FieldValues>({
  label,
  name,
  control,
  placeholder,
  rowCount,
  disabled,
  type = "text",
  id,
}: FormTextInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { onChange: fieldOnChange, onBlur: fieldOnBlur, value },
        fieldState: { error },
      }) => {
        const baseClassName = cn(
          "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "focus:ring-primary",
        );
        const baseProps = {
          name,
          onBlur: () => {
            fieldOnBlur();
          },
          placeholder,
          className: baseClassName,
          value,
          disabled,
        };

        return (
          <div className="mb-4">
            <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground">
              {label}
            </label>
            {rowCount ? (
              <textarea
                id={id}
                rows={rowCount}
                {...baseProps}
                onChange={(e) => {
                  fieldOnChange(e);
                }}
                disabled={disabled}
              />
            ) : (
              <div>
                <input
                  id={id}
                  {...baseProps}
                  type={type}
                  className={baseClassName}
                  onChange={(e) => {
                    fieldOnChange(e);
                  }}
                  disabled={disabled}
                />
              </div>
            )}

            {error && error?.message ? (
              <span className="m-1 block text-xs text-red-600">{error.message}</span>
            ) : null}
          </div>
        );
      }}
    />
  );
}

export default FormTextInput;
