import {Edit, Loader2, Trash2} from "lucide-react";
import {cn} from "@/lib/utils";
import GhostButton2 from "@/shared/components/common/GhostButton2.tsx";
import type {BaseItem, ItemDetail} from "@/shared/types/ItemDetail";
import {getModalButtonColor, getBadgeColor} from "@/shared/utils/colorUtils";
import {getFullImageUrl} from "@/shared/utils/imageUtils";
import {getAlignClasses} from "@/shared/utils/table";
import {AppSwitch} from "@/shared/components/common/AppSwitch.tsx";

interface MiniCardListTableProps<T extends BaseItem = BaseItem> {
    items: T[] | null;
    itemDetails: ItemDetail[];
    removeHandle?: (index: number) => void;
    editHandle?: (itemId: string | number) => void;
    modalHandle?: (name: string, itemId: string | number) => void;
    loading?: boolean;
    error?: string | null;
    emptyMessage?: string;
    className?: string;
    maxHeight?: string;
    minHeight?: string;
}

const getItemData = (item: BaseItem, detail: ItemDetail, index: number): any => {
    if (detail.dataKey) {
        return item[detail.dataKey];
    }
    return item[index + 1];
};

const LoadingState = () => (
    <div className="flex items-center justify-center h-20">
        <Loader2 className="h-4 w-4 animate-spin text-gray-500"/>
        <span className="ml-2 text-gray-500 text-xs">Yükleniyor...</span>
    </div>
);

const ErrorState = ({error}: { error: string }) => (
    <div className="flex items-center justify-center h-20">
        <div className="text-center">
            <div className="text-red-500 text-xs">{error}</div>
        </div>
    </div>
);

const EmptyState = ({message}: { message: string }) => (
    <div className="flex items-center justify-center h-20">
        <div className="text-center">
            <div className="text-gray-500 text-xs">{message}</div>
        </div>
    </div>
);

const TableHeader = ({itemDetails, hasActions}: { itemDetails: ItemDetail[]; hasActions: boolean }) => (
    <div className="px-4 shadow-none h-8">
        <div className="flex h-full content-center">
            <div className="flex flex-1" style={{width: hasActions ? '80%' : '100%'}}>
                {itemDetails.map((item, index) => (
                    <div
                        key={index}
                        className={cn(
                            "flex items-center text-gray-500 text-[10px]",
                            getAlignClasses(item.align ?? (item.center || item.rowType === "modal" ? "center" : undefined)).container
                        )}
                        style={{width: typeof item.width === 'number' ? `${item.width}%` : item.width}}
                    >
                        <span
                            className={cn(getAlignClasses(item.align ?? (item.center || item.rowType === "modal" ? "center" : undefined)).text)}>
                            {item.title}
                        </span>
                    </div>
                ))}
            </div>
            {hasActions && (
                <div className="flex justify-center items-center text-gray-500 text-[10px]" style={{width: '20%'}}>
                    <span>İşlemler</span>
                </div>
            )}
        </div>
    </div>
);

const TableRow = <T extends BaseItem>({
    item,
    index,
    itemDetails,
    removeHandle,
    editHandle,
    modalHandle,
    hasActions
}: {
    item: T;
    index: number;
    itemDetails: ItemDetail[];
    removeHandle?: (index: number) => void;
    editHandle?: (itemId: string | number) => void;
    modalHandle?: (name: string, itemId: string | number) => void;
    hasActions: boolean;
}) => (
    <div className="justify-center rounded-lg shadow-sm bg-white">
        <div className="p-2 flex h-full content-center">
            <div className="flex flex-1" style={{width: hasActions ? '80%' : '100%'}}>
                {itemDetails.map((detail, itemDetailsIndex) => {
                    switch (detail.rowType) {
                        case "text":
                            const textData = getItemData(item, detail, itemDetailsIndex);
                            const formattedText = detail.formatter ? detail.formatter(textData, item) : textData;
                            return (
                                <div
                                    key={itemDetailsIndex}
                                    className={cn("flex flex-col justify-center", getAlignClasses(detail.align).container)}
                                    style={{width: typeof detail.width === 'number' ? `${detail.width}%` : detail.width}}
                                >
                                    <div
                                        className={cn("truncate text-gray-700 text-xs", getAlignClasses(detail.align).text)}>
                                        {formattedText}
                                    </div>
                                </div>
                            );
                        case "date":
                            const rawDate = getItemData(item, detail, itemDetailsIndex);
                            const dateStr = rawDate ? new Date(rawDate).toLocaleString('tr-TR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : '';
                            return (
                                <div
                                    key={itemDetailsIndex}
                                    className={cn("flex flex-col justify-center", getAlignClasses(detail.align).container)}
                                    style={{width: typeof detail.width === 'number' ? `${detail.width}%` : detail.width}}
                                >
                                    <div
                                        className={cn("truncate text-gray-700 text-xs", getAlignClasses(detail.align).text)}>
                                        {dateStr}
                                    </div>
                                </div>
                            );
                        case "badge":
                            const data = getItemData(item, detail, itemDetailsIndex);
                            const formattedBadgeData = detail.formatter ? detail.formatter(data, item) : data;
                            const badgeText = typeof formattedBadgeData === 'object' && 'text' in formattedBadgeData
                                ? formattedBadgeData.text
                                : formattedBadgeData;
                            const badgeColor = typeof formattedBadgeData === 'object' && 'color' in formattedBadgeData && formattedBadgeData.color
                                ? formattedBadgeData.color
                                : detail.color;
                            return (
                                <div
                                    key={itemDetailsIndex}
                                    className={cn("flex flex-wrap justify-start items-center", getAlignClasses(detail.align).container)}
                                    style={{width: typeof detail.width === 'number' ? `${detail.width}%` : detail.width}}
                                >
                                    <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] flex justify-center ${getBadgeColor(badgeColor)}`}>
                                        {badgeText}
                                    </span>
                                </div>
                            );
                        case "modal":
                            return (
                                <div
                                    key={itemDetailsIndex}
                                    className={cn(getAlignClasses("center").container)}
                                    style={{width: typeof detail.width === 'number' ? `${detail.width}%` : detail.width}}
                                >
                                    <GhostButton2
                                        onClick={() => modalHandle?.(detail.name!, item.id)}
                                        text={detail.buttonText!}
                                        className={`${getModalButtonColor(detail.color)} w-full text-xs`}
                                    />
                                </div>
                            );
                        case "image":
                            const imageUrl = getItemData(item, detail, itemDetailsIndex);
                            const fullImageUrl = getFullImageUrl(imageUrl);
                            return (
                                <div
                                    key={itemDetailsIndex}
                                    className={cn("flex flex-col justify-center", getAlignClasses(detail.align).container)}
                                    style={{width: typeof detail.width === 'number' ? `${detail.width}%` : detail.width}}
                                >
                                    {fullImageUrl ? (
                                        <img
                                            src={fullImageUrl}
                                            alt={detail.title}
                                            className="w-8 h-8 object-cover rounded"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                            <span className="text-gray-400 text-[8px]">Yok</span>
                                        </div>
                                    )}
                                </div>
                            );
                        case "switch":
                            const switchValue = getItemData(item, detail, itemDetailsIndex);
                            return (
                                <div
                                    key={itemDetailsIndex}
                                    className={cn("flex flex-col justify-center items-center", getAlignClasses(detail.align ?? "center").container)}
                                    style={{width: typeof detail.width === 'number' ? `${detail.width}%` : detail.width}}
                                >
                                    <AppSwitch
                                        checked={!!switchValue}
                                        onCheckedChange={(checked) => {
                                            detail.onToggle?.(item.id, checked);
                                        }}
                                    />
                                </div>
                            );
                        default:
                            return null;
                    }
                })}
            </div>
            {hasActions && (
                <div className="flex justify-center gap-2 px-2 items-center" style={{width: '20%'}}>
                    {removeHandle && (
                        <GhostButton2
                            text="Sil"
                            onClick={() => removeHandle(index)}
                            icon={Trash2}
                            className="hover:bg-red-500 hover:text-white w-full text-xs"
                        />
                    )}
                    {editHandle && (
                        <GhostButton2
                            text="Düzenle"
                            onClick={() => editHandle(item.id)}
                            icon={Edit}
                            className="hover:bg-orange-500 hover:text-white w-full text-xs"
                        />
                    )}
                </div>
            )}
        </div>
    </div>
);

const MiniCardListTable = <T extends BaseItem = BaseItem>({
    items,
    itemDetails,
    removeHandle,
    editHandle,
    modalHandle,
    loading = false,
    error = null,
    emptyMessage = "Hiç Kayıt Yok",
    className,
    maxHeight = "h-[400px]",
    minHeight
}: MiniCardListTableProps<T>) => {
    if (loading) {
        return <LoadingState/>;
    }

    if (error) {
        return <ErrorState error={error}/>;
    }

    const validItems = items?.filter((item) => item != null && item.id != null) ?? [];

    if (!validItems || validItems.length === 0) {
        return <EmptyState message={emptyMessage}/>;
    }

    return (
        <div className={cn("flex justify-center", className)}>
            <div className="flex flex-col w-full">
                <TableHeader itemDetails={itemDetails} hasActions={!!(removeHandle || editHandle)}/>
                <div className={cn(maxHeight, minHeight, "overflow-y-auto p-2 gap-2 flex flex-col")}>
                    {validItems.map((item) => (
                        <div key={item.id}>
                            <TableRow
                                item={item}
                                index={0}
                                itemDetails={itemDetails}
                                removeHandle={removeHandle}
                                editHandle={editHandle}
                                modalHandle={modalHandle}
                                hasActions={!!(removeHandle || editHandle)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MiniCardListTable;

