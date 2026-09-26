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
    <div className="inline-flex items-center rounded-[3px] border border-brand-ink/20 bg-white">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-neutral-100 active:bg-neutral-200 disabled:opacity-30"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
      >
        <Minus size={16} />
      </button>
      {/* O número sobe ao mudar — a confirmação de que o toque contou. */}
      <span className="w-8 overflow-hidden text-center text-sm font-semibold tabular-nums" aria-live="polite">
        <span key={quantity} className="inline-block animate-rolar-numero motion-reduce:animate-none">
          {quantity}
        </span>
      </span>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-neutral-100 active:bg-neutral-200 disabled:opacity-30"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
