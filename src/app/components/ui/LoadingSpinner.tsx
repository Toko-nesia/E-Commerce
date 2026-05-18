import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  label?: string;
  size?: number;
  className?: string;
}

export function LoadingSpinner({ label, size = 18, className = "" }: LoadingSpinnerProps) {
  return (
    <span className={`inline-flex items-center justify-center gap-2 ${className}`}>
      <Loader2 size={size} className="animate-spin" aria-hidden="true" />
      {label && <span>{label}</span>}
    </span>
  );
}
