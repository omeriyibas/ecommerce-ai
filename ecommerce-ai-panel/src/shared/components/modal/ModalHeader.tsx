import React from 'react';
import {X} from "lucide-react";

export interface ModalHeaderColor {
    hover: string;
}

interface ModalHeaderProps {
    closeHandle: () => void;
    text: string;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ closeHandle, text }) => (
    <div className="flex items-center justify-between w-full p-5">
        <h2 className="text-2xl">{text}</h2>
        <button
            className={"cursor-pointer h-7 hover:text-primary"}
            onClick={closeHandle}
        >
            <X className={"w-full h-full"}/>
        </button>
    </div>
);

export default ModalHeader;


