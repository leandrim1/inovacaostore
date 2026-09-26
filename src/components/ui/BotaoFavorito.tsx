import { type MouseEvent } from "react";
import { Heart } from "lucide-react";
import { useFavoritos } from "../../lib/favoritos";

/**
 * Coração de favoritar com alvo de toque de 44 px. Ao marcar, ele preenche
 * e dá um aperto curto (uma vibração curta no Android) — a confirmação, sem
 * espetáculo. Funciona sobre um link (o card inteiro) sem disparar a
 * navegação.
 */
export function BotaoFavorito({
  produtoId,
  nome,
  className = "",
  tom = "sobre-foto",
}: {
  produtoId: string;
  nome: string;
  className?: string;
  /** "sobre-foto": disco branco por cima da imagem; "solido": contorno, sobre fundo liso. */
  tom?: "sobre-foto" | "solido";
}) {
  const { tem, alternar } = useFavoritos();
  const ativo = tem(produtoId);

  function clicar(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (alternar(produtoId)) navigator.vibrate?.(8);
  }

  return (
    <button
      type="button"
      onClick={clicar}
      aria-pressed={ativo}
      aria-label={ativo ? `Remover ${nome} dos favoritos` : `Favoritar ${nome}`}
      className={`relative grid h-11 w-11 shrink-0 place-items-center [-webkit-tap-highlight-color:transparent] ${className}`}
    >
      <span
        className={`grid h-9 w-9 place-items-center rounded-full transition-transform duration-150 active:scale-90 ${
          tom === "sobre-foto" ? "bg-white/95" : "border border-brand-ink/15 bg-white"
        }`}
      >
        <Heart
          key={ativo ? "sim" : "nao"}
          size={17}
          strokeWidth={2}
          className={`text-brand-ink ${ativo ? "animate-coracao fill-brand-ink" : ""} motion-reduce:animate-none`}
        />
      </span>
    </button>
  );
}
