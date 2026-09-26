import { Minus, Plus } from "lucide-react";

interface QuantityStepperProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
}

export function QuantityStepper({
  quantity,
  onChange,
  min = 1,
  max = 99,
}: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-brand-ink/15">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-neutral-100 disabled:opacity-30"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
      >
        <Minus size={16} />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-neutral-100 disabled:opacity-30"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
