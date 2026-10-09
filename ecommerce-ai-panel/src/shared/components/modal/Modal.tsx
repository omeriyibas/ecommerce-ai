import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils.ts";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";

export interface ModalButtonColor {
    hoverBg: string;
    bg: string;
}

export interface ModalButtonConfig {
    color: string;
    text: string;
    handleButton: () => void;
    loading?: boolean;
    disabled?: boolean;
}

export interface ModalHeaderColor {
    hover: string;
}

interface ModalProps {
    buttons?: ModalButtonConfig[];
    closeHandle: () => void;
    color?: ModalHeaderColor;
    children?: ReactNode;
    headText: string;
    marginY?: string;
    /** Dış panel genişliği / max-width (varsayılan: `w-lg max-w-full`) */
    panelClassName?: string;
    /** Backdrop katmanı (ör. üst üste binen modaller için `z-[100]`) */
    overlayClassName?: string;
}

const Modal: React.FC<ModalProps> = ({
    buttons,
    closeHandle,
    children,
    headText,
    marginY = "my-10",
    panelClassName,
    overlayClassName,
}) => (
    <div
        className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6",
            overlayClassName,
        )}
    >
        <div
            className={cn(
                "relative flex max-h-[min(90vh,920px)] w-full flex-col overflow-hidden rounded-[20px] border border-border bg-card text-card-foreground shadow-[0_10px_40px_rgba(0,0,0,0.25)]",
                panelClassName ?? "w-lg max-w-full",
            )}
        >
            <div className="w-full shrink-0">
                <ModalHeader text={headText} closeHandle={closeHandle} />
                <div className="h-px w-full bg-border" />
            </div>
            <div
                className={cn(
                    "min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden overscroll-contain",
                    marginY,
                )}
            >
                <div className="mx-auto w-11/12 max-w-full">{children}</div>
            </div>
            {buttons && (
                <div className="mt-auto w-full shrink-0">
                    <div className="h-px w-full bg-border" />
                    <div className="mt-5 mb-5 w-full">
                        <ModalFooter buttons={buttons} />
                    </div>
                </div>
            )}
        </div>
    </div>
);

export default Modal;


