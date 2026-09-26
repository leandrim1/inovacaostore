import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

interface SectionHeadingProps {
  index: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}

/**
 * Cabeçalho de seção padronizado (número de índice + regra + eyebrow + título
 * grande) repetido em toda a home — é o que amarra as seções num sistema
 * visual único em vez de cada uma parecer um bloco de template solto.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  action,
  tone = "light",
  className = "",
}: SectionHeadingProps) {
  const muted = tone === "dark" ? "text-white/40" : "text-neutral-400";
  const eyebrowColor = tone === "dark" ? "text-brand-yellow" : "text-brand-yellow-dark";
  const titleColor = tone === "dark" ? "text-white" : "text-brand-ink";
  const descColor = tone === "dark" ? "text-white/60" : "text-neutral-500";
  const ruleColor = tone === "dark" ? "bg-white/25" : "bg-brand-ink/20";

  return (
    <Reveal className={`mb-10 sm:mb-14 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className={`section-eyebrow ${eyebrowColor}`}>
            <span className={`h-px w-8 ${ruleColor}`} aria-hidden />
            <span className={`font-mono text-[11px] tabular-nums ${muted}`}>{index}</span>
            <span>{eyebrow}</span>
          </div>
          <h2 className={`section-title mt-3 ${titleColor}`}>{title}</h2>
          {description && <p className={`mt-4 max-w-lg text-sm sm:text-base ${descColor}`}>{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </Reveal>
  );
}
