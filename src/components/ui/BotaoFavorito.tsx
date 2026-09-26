import { useState, type MouseEvent } from "react";
import { Heart } from "lucide-react";
import { useFavoritos } from "../../lib/favoritos";

/**
 * Coração de favoritar com alvo de toque de 44 px. Ao favoritar: aperta,
 * estoura com faíscas amarelas e assenta (uma vibração curta no Android).
 * Funciona sobre um link (o card inteiro) sem disparar a navegação.
 */
const FAISCAS = [
  [0, -18],
  [15, -10],
  [16, 8],
  [0, 18],
  [-16, 8],
  [-15, -10],
];

export function BotaoFavorito({
  produtoId,
  nome,
  className = "",
  tom = "vidro",
}: {
  produtoId: string;
  nome: string;
  className?: string;
  tom?: "vidro" | "solido";
}) {
  const { tem, alternar } = useFavoritos();
  const ativo = tem(produtoId);
  const [estouro, setEstouro] = useState(0);

  function clicar(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const favoritou = alternar(produtoId);
    if (favoritou) {
      setEstouro((n) => n + 1);
      navigator.vibrate?.(8);
    }
  }

  return (
    <button
      type="button"
      onClick={clicar}
      aria-pressed={ativo}
      aria-label={ativo ? `Remover ${nome} dos favoritos` : `Favoritar ${nome}`}
      className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full [-webkit-tap-highlight-color:transparent] ${className}`}
    >
      <span
        className={`grid h-9 w-9 place-items-center rounded-full transition-transform duration-200 active:scale-90 ${
          tom === "vidro" ? "vidro-claro" : "border border-brand-ink/15 bg-white"
        }`}
      >
        <Heart
          key={estouro}
          size={17}
          strokeWidth={2.2}
          className={`${ativo ? "animate-coracao fill-brand-yellow text-brand-ink" : "text-brand-ink"} motion-reduce:animate-none`}
        />
      </span>
      {ativo && estouro > 0 && (
        <span key={estouro} aria-hidden className="pointer-events-none absolute inset-0 motion-reduce:hidden">
          {FAISCAS.map(([x, y], i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-brand-yellow [animation:faisca_0.55s_ease-out_forwards]"
              style={{ ["--fx" as string]: `${x}px`, ["--fy" as string]: `${y}px` }}
            />
          ))}
        </span>
      )}
    </button>
  );
}
