import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { NumericFormat, type NumericFormatProps } from "react-number-format";
import { cn } from "@/lib/utils.ts";

type FormNumberInputProps<T extends FieldValues = FieldValues> = {
  label: string;
  name: FieldPath<T>;
  control: Control<T>;
  placeholder?: string;
  touched?: boolean;
  thousandSeparator?: boolean | string;
  decimalSeparator?: string;
  decimalScale?: number;
  allowNegative?: boolean;
  fixedDecimalScale?: boolean;
  prefix?: string;
  suffix?: string;
} & Omit<
  NumericFormatProps,
  "onValueChange" | "customInput" | "value" | "onChange" | "name"
>;

function FormNumberInput<T extends FieldValues = FieldValues>({
  label,
  name,
  control,
  placeholder,
  thousandSeparator = ".",
  decimalSeparator = ",",
  decimalScale,
  allowNegative = false,
  fixedDecimalScale,
  prefix,
  suffix,
  ...rest
}: FormNumberInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange: fieldOnChange, value }, fieldState: { error } }) => {
        const baseClassName = cn(
          "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "focus:ring-primary",
        );

        return (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
            <NumericFormat
              value={value as number | string | undefined}
              placeholder={placeholder}
              inputMode="decimal"
              thousandSeparator={thousandSeparator}
              decimalSeparator={decimalSeparator}
              decimalScale={decimalScale}
              fixedDecimalScale={fixedDecimalScale}
              allowNegative={allowNegative}
              prefix={prefix}
              suffix={suffix}
              className={baseClassName}
              onValueChange={({ floatValue }) => fieldOnChange(floatValue)}
              {...rest}
            />

            {error && error?.message ? (
              <span className="m-1 block text-xs text-red-600">{error.message}</span>
            ) : null}
          </div>
        );
      }}
    />
  );
}

export default FormNumberInput;
