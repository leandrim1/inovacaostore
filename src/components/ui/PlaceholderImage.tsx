import { Shirt } from "lucide-react";

export function PlaceholderImage({ label }: { label?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
      <Shirt size={40} strokeWidth={1.25} className="text-brand-yellow" />
      {label && (
        <span className="font-display text-xs tracking-[0.2em] text-white/70">
          {label}
        </span>
      )}
    </div>
  );
}
