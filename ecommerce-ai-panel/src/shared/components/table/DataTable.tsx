import React from "react";
import { cn } from "@/lib/utils";
import GhostButton2 from "@/shared/components/common/GhostButton2.tsx";
import { getModalButtonColor, getBadgeColor } from "@/shared/utils/colorUtils";
import { getFullImageUrl } from "@/shared/utils/imageUtils";
import { formatCurrency, formatNumber } from "@/shared/utils/table";
import type {ItemDetail} from "@/shared/types/ItemDetail.ts";
import { Edit, Loader2, Trash2 } from "lucide-react";
import { useInfiniteScrollRef } from "@/shared/hooks/useInfiniteScrollRef.ts";

export type ColumnRowType =
    | "text"
    | "date"
    | "image"
    | "modal"
    | "currency"
    | "number";

export interface DataTableProps<T> {
    rows: T[];
    columns: Array<ItemDetail>;
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
    // format varsayılanları
    locale?: string; // number/currency için
    currency?: string; // currency rowType için
    minimumFractionDigits?: number; // number/currency için
    // modal handler
    onModalClick?: (name: string, itemId: string | number, row: T) => void;
    // Action handlers
    removeHandle?: (index: number) => void;
    editHandle?: (itemId: string | number) => void;
    // Pagination props
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    fetchNextPage?: () => void;
    paginationEnabled?: boolean;
}

// utils imported from shared/utils/table

function DataTable<T>(props: DataTableProps<T>) {
    const {
        rows,
        columns,
        loading = false,
        emptyMessage = "Hiç Kayıt Yok",
        className,
        locale = "tr-TR",
        currency = "TRY",
        minimumFractionDigits,
        onModalClick,
        removeHandle,
        editHandle,
        hasNextPage = false,
        isFetchingNextPage = false,
        fetchNextPage,
        paginationEnabled = false
    } = props;

    const lastItemElementRef = useInfiniteScrollRef<HTMLTableRowElement>({
        enabled: paginationEnabled,
        hasNextPage,
        isFetchingNextPage,
        isLoading: loading,
        fetchNextPage,
    });

    // Helper function to get data from item using dataKey
    const getItemData = (item: any, detail: ItemDetail, index: number): any => {
        let data;
        if (detail.dataKey) {
            data = item[detail.dataKey];
        } else {
            data = item[index + 1];
        }

        // Apply formatter if exists
        if (detail.formatter) {
            return detail.formatter(data);
        }

        return data;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Yükleniyor...
            </div>
        );
    }

    if (!rows || rows.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">{emptyMessage}</div>
        );
    }

    return (
        <div className={cn("p-6", className)}>
            <table className="w-full border border-gray-200 rounded-lg border-separate">
                <thead>
                    <tr className="bg-gray-50">
                        {/* Serial Number Column */}
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center">
                                <input className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" type="checkbox"/>
                                <label className="ml-2 text-sm font-medium text-gray-700">S.L</label>
                            </div>
                        </th>

                        {/* Dynamic Columns */}
                        {columns.map((col, i) => (
                            <th key={i} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center gap-2">
                                    {col.title}
                                    <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m8 15 4 4 4-4m0-6-4-4-4 4"/>
                                    </svg>
                                </div>
                            </th>
                        ))}

                        {/* Actions Column */}
                        {(removeHandle || editHandle) && (
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center gap-2">
                                    Action
                                </div>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {rows.map((row, rIndex) => {
                        const isLastItem = rIndex === rows.length - 1;
                        return (
                            <tr
                                key={rIndex}
                                className="hover:bg-gray-50"
                                ref={isLastItem && paginationEnabled ? lastItemElementRef : undefined}
                            >
                                {/* Serial Number */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <input className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" type="checkbox"/>
                                        <label className="ml-2 text-sm text-gray-700">
                                            {String(rIndex + 1).padStart(2, '0')}
                                        </label>
                                    </div>
                                </td>

                                {/* Dynamic Columns */}
                                {columns.map((col, cIndex) => {
                                    const rawValue = getItemData(row, col, cIndex);
                                    let content: React.ReactNode = null;

                                    switch (col.rowType) {
                                        case "text":
                                            content = rawValue as React.ReactNode;
                                            break;
                                        case "badge":
                                            content = (
                                                <span className={cn("px-6 py-1.5 rounded-full font-medium text-sm",getBadgeColor(rawValue.color))}>
                                                    {rawValue.text}
                                                </span>
                                            );
                                            break;
                                        case "date": {
                                            content = rawValue
                                                ? new Date(rawValue as any).toLocaleString(locale)
                                                : "";
                                            break;
                                        }
                                        case "number":
                                            content = formatNumber(rawValue, locale, minimumFractionDigits);
                                            break;
                                        case "currency":
                                            content = formatCurrency(rawValue, locale, currency, minimumFractionDigits);
                                            break;
                                        case "image": {
                                            const full = getFullImageUrl(rawValue);
                                            content = full ? (
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0">
                                                        <img src={full} alt={col.title} className="h-10 w-10 rounded-lg object-cover" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0">
                                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold text-sm">
                                                            {String(rawValue || 'N/A').substring(0, 2).toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                            break;
                                        }
                                        case "modal":
                                            content = (
                                                <GhostButton2
                                                    onClick={() => {
                                                        if (onModalClick && col.name) {
                                                            const itemId = (row as any).id;
                                                            onModalClick(col.name, itemId, row);
                                                        }
                                                    }}
                                                    text={col.buttonText || "Detay"}
                                                    className={cn(`${getModalButtonColor(col.color as any)} w-full`)}
                                                />
                                            );
                                            break;
                                        default:
                                            content = rawValue as React.ReactNode;
                                    }

                                    return (
                                        <td key={cIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {content}
                                        </td>
                                    );
                                })}

                                {/* Actions Column */}
                                {(removeHandle || editHandle) && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            {editHandle && (
                                                <button
                                                    onClick={() => editHandle((row as any).id)}
                                                    className="w-8 h-8 bg-green-50 text-green-600 rounded-full inline-flex items-center justify-center hover:bg-green-100 transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            )}
                                            {removeHandle && (
                                                <button
                                                    onClick={() => removeHandle(rIndex)}
                                                    className="w-8 h-8 bg-red-50 text-red-600 rounded-full inline-flex items-center justify-center hover:bg-red-100 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        );
                    })}

                    {/* Pagination loading indicator */}
                    {paginationEnabled && isFetchingNextPage && (
                        <tr>
                            <td colSpan={columns.length + 1 + ((removeHandle || editHandle) ? 1 : 0)} className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                                    <span className="ml-2 text-gray-500 text-sm">Daha fazla yükleniyor...</span>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default DataTable;


