import {Edit, Loader2, Trash2} from "lucide-react";
import {cn} from "@/lib/utils";
import GhostButton2 from "@/shared/components/common/GhostButton2.tsx";
import type {BaseItem, ItemDetail} from "@/shared/types/ItemDetail";
import {getModalButtonColor, getBadgeColor} from "@/shared/utils/colorUtils";
import {getFullImageUrl} from "@/shared/utils/imageUtils";
import {getAlignClasses} from "@/shared/utils/table";
import {AppSwitch} from "@/shared/components/common/AppSwitch.tsx";
import {useInfiniteScrollRef} from "@/shared/hooks/useInfiniteScrollRef.ts";
import {useRef, type ComponentType} from "react";

interface CardListTableProps<T extends BaseItem = BaseItem> {
    items: T[] | null;
    itemDetails: ItemDetail[];
    removeHandle?: (index: number) => void;
    editHandle?: (itemId: string | number) => void;
    /** Varsayılan: Düzenle */
    editButtonText?: string;
    editButtonIcon?: ComponentType<{ className?: string; size?: number }>;
    /** Varsayılan: Sil */
    removeButtonText?: string;
    removeButtonIcon?: ComponentType<{ className?: string; size?: number }>;
    modalHandle?: (name: string, itemId: string | number) => void;
    loading?: boolean;
    error?: string | null;
    emptyMessage?: string;
    className?: string;
    // Pagination props
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    fetchNextPage?: () => void;
    paginationEnabled?: boolean;
    /** Kayıt listesi kaydırma alanı yüksekliği (varsayılan 80vh). */
    listMaxHeight?: string;
}

// Helper function to get data from item using dataKey or fallback to index
const getItemData = (item: BaseItem, detail: ItemDetail, index: number): any => {
    if (detail.dataKey) {
        return item[detail.dataKey];
    }
    // Fallback to index-based access for backward compatibility
    return item[index + 1];
};

// Loading component
const LoadingState = () => (
    <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
        <span className="ml-2 text-muted-foreground">Yükleniyor...</span>
    </div>
);

// Error component
const ErrorState = ({error}: { error: string }) => (
    <div className="flex items-center justify-center h-32">
        <div className="text-center">
            <div className="text-destructive text-sm">{error}</div>
        </div>
    </div>
);

// Empty state component
const EmptyState = ({message}: { message: string }) => (
    <div className="flex items-center justify-center h-32">
        <div className="text-center">
            <div className="text-muted-foreground text-sm">{message}</div>
        </div>
    </div>
);

// Table header component
const TableHeader = ({itemDetails, hasActions}: { itemDetails: ItemDetail[]; hasActions: boolean }) => (
    <div className="px-10 shadow-none h-12">
        <div className="flex h-full content-center">
            {/* Kolon başlıkları */}
            <div className="flex min-w-0 flex-1">
                {itemDetails.map((item, index) => (
                    <div
                        key={index}
                        className={cn(
                            "flex items-center mb-2 md:mb-0 text-muted-foreground text-xs",
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

            {/* Düğmeler için alan */}
            {hasActions && (
                <div className="flex w-[min(40%,14rem)] shrink-0 justify-center items-center text-muted-foreground text-xs">
                    <span>İşlemler</span>
                </div>
            )}
        </div>
    </div>
);

// Table row component
const TableRow = <T extends BaseItem>({
                                          item,
                                          index,
                                          itemDetails,
                                          removeHandle,
                                          editHandle,
                                          editButtonText = "Düzenle",
                                          editButtonIcon: EditIcon = Edit,
                                          removeButtonText = "Sil",
                                          removeButtonIcon: RemoveIcon = Trash2,
                                          modalHandle,
                                          hasActions
                                      }: {
    item: T;
    index: number;
    itemDetails: ItemDetail[];
    removeHandle?: (index: number) => void;
    editHandle?: (itemId: string | number) => void;
    editButtonText?: string;
    editButtonIcon?: ComponentType<{ className?: string; size?: number }>;
    removeButtonText?: string;
    removeButtonIcon?: ComponentType<{ className?: string; size?: number }>;
    modalHandle?: (name: string, itemId: string | number) => void;
    hasActions: boolean;
}) => (
    <div className="justify-center rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="p-5 flex h-full content-center">
            {/* Kolonlar */}
            <div className="flex min-w-0 flex-1">
                {itemDetails.map((detail, itemDetailsIndex) => {
                    switch (detail.rowType) {
                        case "text":
                            const textData = getItemData(item, detail, itemDetailsIndex);
                            const formattedText = detail.formatter ? detail.formatter(textData, item) : textData;
                            const formattedNode =
                                typeof formattedText === "object" &&
                                formattedText !== null &&
                                "text" in formattedText
                                    ? formattedText.text
                                    : formattedText;
                            return (
                                <div
                                    key={itemDetailsIndex}
                                    className={cn("flex flex-col justify-center min-w-0", getAlignClasses(detail.align).container)}
                                    style={{width: typeof detail.width === 'number' ? `${detail.width}%` : detail.width}}
                                >
                                    <div
                                        className={cn(
                                            !detail.noTruncate && "truncate",
                                            detail.noTruncate && "whitespace-nowrap tabular-nums",
                                            "text-foreground custom-text",
                                            getAlignClasses(detail.align).text
                                        )}>
                                        {formattedNode}
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
                                        className={cn("truncate text-foreground custom-text", getAlignClasses(detail.align).text)}>
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
                                    <span className={`px-6 py-1.5 rounded-full font-medium text-sm flex justify-center ${getBadgeColor(badgeColor)}`}>
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
                                        className={`${getModalButtonColor(detail.color)} w-full`}
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
                                            className="w-12 h-12 object-cover rounded-lg"
                                        />
                                    ) : (
                                        <div
                                            className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                            <span className="text-muted-foreground text-xs">Resim Yok</span>
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

            {/* Düğmeler — düzenle/devam solda, sil sağda */}
            {hasActions && (
                <div className="flex w-[min(40%,14rem)] shrink-0 flex-wrap justify-end gap-1 px-1 items-center">
                    {editHandle && (
                        <GhostButton2
                            text={editButtonText}
                            onClick={() => editHandle(item.id)}
                            icon={EditIcon}
                            className="hover:bg-orange-500 hover:text-white shrink-0 whitespace-nowrap px-2 py-2"
                        />
                    )}
                    {removeHandle && (
                        <GhostButton2
                            text={removeButtonText}
                            onClick={() => removeHandle(index)}
                            icon={RemoveIcon}
                            className="hover:bg-red-500 hover:text-white shrink-0 whitespace-nowrap px-2 py-2"
                        />
                    )}
                </div>
            )}
        </div>
    </div>
);

const CardListTable = <T extends BaseItem = BaseItem>({
                                                          items,
                                                          itemDetails,
                                                          removeHandle,
                                                          editHandle,
                                                          editButtonText = "Düzenle",
                                                          editButtonIcon,
                                                          removeButtonText = "Sil",
                                                          removeButtonIcon,
                                                          modalHandle,
                                                          loading = false,
                                                          error = null,
                                                          emptyMessage = "Hiç Kayıt Yok",
                                                          className,
                                                          hasNextPage = false,
                                                          isFetchingNextPage = false,
                                                          fetchNextPage,
                                                          paginationEnabled = false,
                                                          listMaxHeight = "80vh",
                                                      }: CardListTableProps<T>) => {
    const scrollRootRef = useRef<HTMLDivElement | null>(null);
    const lastItemElementRef = useInfiniteScrollRef<HTMLDivElement>({
        enabled: paginationEnabled,
        hasNextPage,
        isFetchingNextPage,
        isLoading: loading,
        fetchNextPage,
        rootRef: scrollRootRef,
    });

    // Loading state
    if (loading) {
        return <LoadingState/>;
    }

    // Error state
    if (error) {
        return <ErrorState error={error}/>;
    }

    // Filter out null/undefined items to prevent errors
    const validItems = items?.filter((item) => item != null && item.id != null) ?? [];

    // Empty state
    if (!validItems || validItems.length === 0) {
        return <EmptyState message={emptyMessage}/>;
    }

    return (
        <div className={cn("flex justify-center", className)}>
            <div className="flex flex-col w-full">
                <TableHeader itemDetails={itemDetails} hasActions={!!(removeHandle || editHandle)}/>
                <div
                    ref={scrollRootRef}
                    className="overflow-y-auto p-4 flex flex-col gap-3"
                    style={{ height: listMaxHeight }}
                >
                    {validItems.map((item, index) => {
                        const isLastItem = index === validItems.length - 1;
                        return (
                            <div
                                key={item.id}
                                ref={isLastItem && paginationEnabled ? lastItemElementRef : undefined}
                            >
                                <TableRow
                                    item={item}
                                    index={index}
                                    itemDetails={itemDetails}
                                    removeHandle={removeHandle}
                                    editHandle={editHandle}
                                    editButtonText={editButtonText}
                                    editButtonIcon={editButtonIcon}
                                    removeButtonText={removeButtonText}
                                    removeButtonIcon={removeButtonIcon}
                                    modalHandle={modalHandle}
                                    hasActions={!!(removeHandle || editHandle)}
                                />
                            </div>
                        );
                    })}

                    {/* Pagination loading indicator */}
                    {paginationEnabled && isFetchingNextPage && (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>
                            <span className="ml-2 text-muted-foreground text-sm">Daha fazla yükleniyor...</span>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default CardListTable;
