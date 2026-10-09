import React from "react";
import {cn} from "@/lib/utils";

type Button1Props = {
    text: string;
    icon?: React.ElementType;
    iconSize?: number;
    buttonSize?: "default" | "sm" | "lg" | "icon";
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    className?: string;
};

const GhostButton1 = ({text, icon: Icon, iconSize, onClick, className}: Button1Props) => {
    return (
        <button
            onClick={onClick}
            className={cn("inline-flex items-center gap-2 hover:border-primary border-transparent border-2 py-3 px-2 rounded-lg text-primary justify-center", className)}
        >
            {Icon && <Icon className="text-primary" size={iconSize} />}
            {text && <span>{text}</span>}
        </button>
    )
};

export default GhostButton1;
