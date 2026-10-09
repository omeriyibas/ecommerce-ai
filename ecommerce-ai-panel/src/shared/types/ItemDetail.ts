import type { ReactNode } from "react";

export type ModalButtonColor = 
    | 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'pink' 
    | 'indigo' | 'teal' | 'cyan' | 'lime' | 'amber' | 'emerald' 
    | 'violet' | 'fuchsia' | 'rose' | 'sky' | 'slate' | 'gray' 
    | 'zinc' | 'neutral' | 'stone';

export interface ItemDetail {
    title: string;
    width: string | number;
    center?: boolean;
    align?: "left" | "center" | "right";
    rowType: "text" | "modal" | "image" | "date" | "badge" | "switch" | "number" | "currency";
    name?: string;
    buttonText?: string;
    dataKey?: string; // Key to access data from item object
    color?: ModalButtonColor; // Modal button color - sadece desteklenen renkler
    formatter?: (value: any, item?: BaseItem) => { text: string; color?: ModalButtonColor; disabled?: boolean } | string | ReactNode; // Function to format the value
    onToggle?: (itemId: string | number, checked: boolean) => void; // Switch toggle handler
    /** Metin hücresinde truncate kapalı; dar kolonlarda sayı/tarih kesilmesini önlemek için */
    noTruncate?: boolean;
}

export interface BaseItem {
    id: string | number;
    [key: string]: any;
}
