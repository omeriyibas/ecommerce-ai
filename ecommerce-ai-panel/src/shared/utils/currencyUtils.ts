export const formatCurrency = (value?: number | string | null): string => {
    if (value === null || value === undefined) {
        return "-";
    }

    const numValue = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(numValue)) {
        return "-";
    }

    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
    }).format(numValue);
};

