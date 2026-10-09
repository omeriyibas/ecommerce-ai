import React from "react";
import {cn} from "@/lib/utils";

type Button1Props = {
    text: string;
    icon?: React.ElementType;
    iconSize?: number;
    buttonSize?: "default" | "sm" | "lg" | "icon";
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    className?: string;
    disabled?: boolean;
};

const GhostButton1 = ({text, icon: Icon, iconSize, onClick, className, disabled = false}: Button1Props) => {
    return (
        <button
            onClick={(e) => { if (!disabled) onClick?.(e); }}
            disabled={disabled}
            className={cn("inline-flex group items-center gap-2 border-transparent border-2 py-3 px-2 rounded-lg text-primary justify-center",
                disabled ? "opacity-50 cursor-not-allowed" : "",
                className)}
        >
            {Icon && <Icon className={cn("text-primary", disabled ? "" : "group-hover:text-white")} size={iconSize} />}
            {text && <span>{text}</span>}
        </button>
    )
};

export default GhostButton1;
