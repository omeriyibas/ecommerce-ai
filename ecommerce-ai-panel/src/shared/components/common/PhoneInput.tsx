"use client";

import { Controller, type Control, type FieldValues } from "react-hook-form";
import { PatternFormat, type PatternFormatProps } from "react-number-format";
import { cn } from "@/lib/utils.ts";
import React from "react";

interface BasePhoneInputProps
    extends Omit<PatternFormatProps, "name" | "value" | "onValueChange" | "onChange" | "customInput" | "format"> {
    label?: string;
    placeholder?: string;
    helperText?: string;
    disabled?: boolean;
    className?: string;
    format?: PatternFormatProps["format"];
}

type PhoneInputWithFormProps = BasePhoneInputProps & {
    name: string;
    control: Control<FieldValues>;
    value?: never;
    onChange?: never;
};

type PhoneInputControlledProps = BasePhoneInputProps & {
    name?: string;
    control?: never;
    value?: string;
    onChange?: (value: string) => void;
};

type PhoneInputProps = PhoneInputWithFormProps | PhoneInputControlledProps;

const DEFAULT_PHONE_FORMAT = "(###) ### ## ##";

const PhoneInput: React.FC<PhoneInputProps> = ({
    label,
    name,
    control,
    placeholder = "(5xx) xxx xx xx",
    helperText,
    disabled,
    className,
    format = DEFAULT_PHONE_FORMAT,
    mask = "_",
    ...rest
}) => {
    const externalOnChange = "onChange" in rest ? rest.onChange : undefined;
    const patternRest = { ...rest };
    if ("onChange" in patternRest) {
        delete (patternRest as { onChange?: unknown }).onChange;
    }

    const baseClassName = cn(
        "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60",
        className
    );

    if (control && name) {
        return (
            <Controller
                control={control}
                name={name}
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
                    const inputClassName = cn(
                        baseClassName,
                        error
                            ? "border-destructive focus:border-destructive focus:ring-destructive"
                            : "focus:ring-primary",
                    );
                    return (
                        <div className="flex flex-col gap-1">
                            {label && <label className="text-sm font-medium text-foreground">{label}</label>}
                            <PatternFormat
                                {...(patternRest as Omit<
                                    PatternFormatProps,
                                    "name" | "value" | "onValueChange" | "onChange" | "customInput" | "format"
                                >)}
                                name={name}
                                value={value ?? ""}
                                format={format}
                                mask={mask}
                                placeholder={placeholder}
                                className={inputClassName}
                                disabled={disabled}
                                onBlur={onBlur}
                                onValueChange={({ value: rawValue }) => onChange(rawValue)}
                            />
                            {helperText && !error && (
                                <span className="text-xs text-muted-foreground">{helperText}</span>
                            )}
                            {error?.message && (
                                <span className="text-xs text-destructive">{error.message}</span>
                            )}
                        </div>
                    );
                }}
            />
        );
    }

    return (
        <div className="flex flex-col gap-1">
            {label && <label className="text-sm font-medium text-foreground">{label}</label>}
            <PatternFormat
                {...(patternRest as Omit<
                    PatternFormatProps,
                    "name" | "value" | "onValueChange" | "onChange" | "customInput" | "format"
                >)}
                name={name}
                value={rest.value ?? ""}
                format={format}
                mask={mask}
                placeholder={placeholder}
                className={cn(baseClassName, "focus:ring-primary")}
                disabled={disabled}
                onValueChange={({ value: rawValue }) => externalOnChange?.(rawValue)}
            />
            {helperText && <span className="text-xs text-muted-foreground">{helperText}</span>}
        </div>
    );
};

export default PhoneInput;