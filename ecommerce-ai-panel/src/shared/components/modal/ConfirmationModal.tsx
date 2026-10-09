import React from 'react';
import Modal from './Modal';
import type { ModalButtonConfig } from './Modal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    extraContent?: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Evet',
    cancelText = 'Hayır',
    confirmColor,
    extraContent,
}) => {
    if (!isOpen) return null;

    const buttons: ModalButtonConfig[] = [
        {
            color: 'bg-gray-500 hover:bg-gray-600',
            text: cancelText,
            handleButton: onClose
        },
        {
            color: confirmColor || 'bg-red-500 hover:bg-red-600',
            text: confirmText,
            handleButton: onConfirm
        }
    ];

    return (
        <Modal
            headText={title}
            closeHandle={onClose}
            buttons={buttons}
        >
            <div className="text-center">
                <p className="text-gray-700 text-lg">{message}</p>
                {extraContent}
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
