export type ColumnAlign = "left" | "center" | "right";

export const getAlignClasses = (align?: ColumnAlign) => {
    switch (align) {
        case "center":
            return { container: "justify-center", text: "text-center" };
        case "right":
            return { container: "justify-end", text: "text-right" };
        default:
            return { container: "", text: "text-left" };
    }
};

export const formatNumber = (value: unknown, locale: string, minimumFractionDigits?: number) => {
    if (value == null || value === "") return "";
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) return String(value);
    return num.toLocaleString(locale, { minimumFractionDigits });
};

export const formatCurrency = (value: unknown, locale: string, currency: string, minimumFractionDigits?: number) => {
    if (value == null || value === "") return "";
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) return String(value);
    return num.toLocaleString(locale, { style: "currency", currency, minimumFractionDigits });
};

export const cellWidthStyle = (width?: string | number) =>
    width !== undefined ? { width: typeof width === "number" ? `${width}%` : width } : undefined;


