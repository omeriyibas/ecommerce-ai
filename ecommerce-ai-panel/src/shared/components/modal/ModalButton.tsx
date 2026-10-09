import React from 'react';
import { Loader2 } from 'lucide-react';
import {cn} from "@/lib/utils.ts";

export interface ModalButtonColor {
    hoverBg: string;
    bg: string;
}

interface ModalButtonProps {
    handleButton: () => void;
    color: string;
    text: string;
    loading?: boolean;
    disabled?: boolean;
}

const ModalButton: React.FC<ModalButtonProps> = ({ handleButton, color, text, loading = false, disabled = false }) => (
    <button
        type="button"
        onClick={handleButton}
        disabled={disabled || loading}
        className={cn("px-5 py-2 text-white rounded-lg transition cursor-pointer inline-flex items-center gap-2",
            color,
            (disabled || loading) ? "opacity-80 cursor-not-allowed" : ""
        )}
    >
        {loading && (
            <Loader2 className="size-4 animate-spin" />
        )}
        <span>{text}</span>
    </button>
);

export default ModalButton;
