import { createPortal } from "react-dom";
import Modal from "@/shared/components/modal/Modal.tsx";

interface DynamicAlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  closeText?: string;
  closeColor?: string;
  onClose: () => void;
}

export default function DynamicAlertModal({
  isOpen,
  title,
  message,
  closeText = "Tamam",
  closeColor = "bg-primary hover:bg-primary/90",
  onClose,
}: DynamicAlertModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <Modal
      headText={title}
      panelClassName="w-full max-w-md"
      overlayClassName="z-[100]"
      closeHandle={onClose}
      buttons={[
        {
          text: closeText,
          handleButton: onClose,
          color: closeColor,
        },
      ]}
    >
      <p className="whitespace-pre-line text-sm text-foreground">{message}</p>
    </Modal>,
    document.body,
  );
}
