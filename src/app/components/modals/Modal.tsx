import { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}

export function Modal({ isOpen, onClose, children, width = "max-w-[533px]" }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className={`bg-white rounded-[8px] ${width} w-full mx-4 relative overflow-hidden`} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-6 top-10 cursor-pointer bg-transparent border-none p-0 z-10">
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
