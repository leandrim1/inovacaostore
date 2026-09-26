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
    <div className="inline-flex items-center rounded-full border border-brand-ink/15 bg-white shadow-[inset_0_1px_0_#fff,0_3px_0_rgba(10,10,10,0.08)]">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        className="flex h-11 w-11 items-center justify-center rounded-full transition-[background-color,transform] hover:bg-neutral-100 active:scale-90 disabled:opacity-30"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
      >
        <Minus size={16} />
      </button>
      {/* O número "rola" ao mudar, como um contador mecânico. */}
      <span className="w-8 overflow-hidden text-center text-sm font-semibold tabular-nums [perspective:200px]" aria-live="polite">
        <span key={quantity} className="inline-block animate-rolar-numero motion-reduce:animate-none">
          {quantity}
        </span>
      </span>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        className="flex h-11 w-11 items-center justify-center rounded-full transition-[background-color,transform] hover:bg-neutral-100 active:scale-90 disabled:opacity-30"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
