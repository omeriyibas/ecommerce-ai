import React from 'react';
import ModalButton from './ModalButton';
import type { ModalButtonConfig } from './Modal';

interface ModalFooterProps {
    buttons: ModalButtonConfig[];
}

const ModalFooter: React.FC<ModalFooterProps> = ({ buttons }) => (
    <div className={"flex flex-wrap justify-end mx-5 gap-2"}>
        {buttons.map((button, index) => (
            <ModalButton key={index} color={button.color} text={button.text} handleButton={button.handleButton} loading={button.loading} disabled={button.disabled} />
        ))}
    </div>
);

export default ModalFooter;


