import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

interface SectionHeadingProps {
  title: ReactNode;
  description?: ReactNode;
  /** Link ou informação à direita da régua ("Ver tudo", nota média, @perfil). */
  action?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}

/**
 * Abertura de seção da home, no mesmo desenho em todas: uma régua fina de
 * ponta a ponta, o título grande à esquerda e o apoio (descrição e ação)
 * alinhado pela base, à direita no computador. A assimetria e a régua é que
 * amarram as seções — sem numeração, sem sobretítulo decorativo.
 */
export function SectionHeading({ title, description, action, tone = "light", className = "" }: SectionHeadingProps) {
  const escuro = tone === "dark";
  const regua = escuro ? "border-white/20" : "border-brand-ink/15";
  const titulo = escuro ? "text-white" : "text-brand-ink";
  const apoio = escuro ? "text-white/65" : "text-neutral-600";

  // Uma grade só, sem duplicar nada: no celular, título e ação na primeira
  // linha e a descrição embaixo; no computador, título | descrição | ação.
  return (
    <Reveal className={`mb-8 sm:mb-12 ${className}`}>
      <div
        className={`grid grid-cols-[1fr_auto] gap-x-6 gap-y-3 border-t pt-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)_auto] lg:items-end lg:gap-x-10 ${regua}`}
      >
        <h2
          className={`col-start-1 row-start-1 self-end font-display text-[clamp(2.6rem,11vw,5.25rem)] leading-[0.84] tracking-[0.005em] ${titulo}`}
        >
          {title}
        </h2>
        {action && <div className="col-start-2 row-start-1 self-end pb-1 lg:col-start-3">{action}</div>}
        {description && (
          <p
            className={`col-span-2 row-start-2 max-w-sm text-[15px] leading-relaxed lg:col-span-1 lg:col-start-2 lg:row-start-1 ${apoio}`}
          >
            {description}
          </p>
        )}
      </div>
    </Reveal>
  );
}
