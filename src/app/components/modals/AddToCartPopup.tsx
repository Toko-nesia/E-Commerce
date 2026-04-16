import { useEffect } from "react";
import { CheckCircle } from "lucide-react";

interface AddToCartPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddToCartPopup({ isOpen, onClose }: AddToCartPopupProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-[#ececec] rounded-[4px] w-[552px] h-[269px] flex flex-col items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
        <CheckCircle size={48} className="text-black" />
        <p className="font-['Inter',sans-serif] text-[36px] text-black tracking-[-1.08px]">Added to your cart!</p>
      </div>
    </div>
  );
}
