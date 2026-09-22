import type { ReactNode } from "react";

/**
 * Bandeiras e formas de pagamento aceitas pela loja.
 *
 * Cada marca é um SVG inline, desenhado para ficar nítido nos ~28px em que
 * aparece e no MESMO enquadramento (48x32) das outras — é isso que faz a
 * fileira parecer um conjunto, e não logos soltos de tamanhos diferentes.
 * Sendo SVG, não custa requisição nenhuma e não pesa no carregamento.
 *
 * Quando os arquivos oficiais de cada bandeira chegarem, troque o `art` do
 * item por `<image href={arquivo} width="48" height="32" />` — ou passe a
 * renderizar um `<img>` no lugar do `<svg>` em PaymentStrip. O resto do
 * bloco não muda em nada.
 */

/** Proporção do enquadramento que TODAS as marcas compartilham. */
export const PAYMENT_MARK_VIEWBOX = "0 0 48 32";

export interface PaymentBrand {
  id: string;
  /** Nome lido por leitores de tela e mostrado no `title` ao passar o mouse. */
  label: string;
  /** Conteúdo do SVG. A moldura fica com quem renderiza, para a proporção
   *  ser garantida num lugar só. */
  art: ReactNode;
}

/** Tipografia comum dos wordmarks, para nenhum ficar em corpo diferente. */
const WORDMARK = {
  textAnchor: "middle" as const,
  fontFamily: "Inter, system-ui, sans-serif",
  fontWeight: 800,
};

export const PAYMENT_BRANDS: PaymentBrand[] = [
  {
    id: "visa",
    label: "Visa",
    art: (
      <>
        <text x="24" y="21" {...WORDMARK} fontSize="14" fontStyle="italic" letterSpacing="0.4" fill="#1A1F71">
          VISA
        </text>
      </>
    ),
  },
  {
    id: "mastercard",
    label: "Mastercard",
    art: (
      <>
        {/* Os dois círculos sobrepostos são o que torna a marca reconhecível
            sem uma letra sequer; o tom do meio é a interseção real. */}
        <defs>
          <clipPath id="brand-mc-clip">
            <circle cx="19" cy="16" r="11" />
          </clipPath>
        </defs>
        <circle cx="19" cy="16" r="11" fill="#EB001B" />
        <circle cx="29" cy="16" r="11" fill="#F79E1B" />
        <circle cx="29" cy="16" r="11" fill="#FF5F00" clipPath="url(#brand-mc-clip)" />
      </>
    ),
  },
  {
    id: "elo",
    label: "Elo",
    art: (
      <>
        <rect x="2" y="4" width="44" height="24" rx="4" fill="#0A0A0A" />
        <circle cx="17" cy="12" r="2.4" fill="#FFCB05" />
        <circle cx="24" cy="12" r="2.4" fill="#EF4123" />
        <circle cx="31" cy="12" r="2.4" fill="#00A4E0" />
        <text x="24" y="25" {...WORDMARK} fontSize="9" letterSpacing="0.6" fill="#FFFFFF">
          elo
        </text>
      </>
    ),
  },
  {
    id: "amex",
    label: "American Express",
    art: (
      <>
        <rect x="2" y="4" width="44" height="24" rx="4" fill="#2E77BC" />
        <text x="24" y="20" {...WORDMARK} fontSize="10" letterSpacing="0.8" fill="#FFFFFF">
          AMEX
        </text>
      </>
    ),
  },
  {
    id: "hipercard",
    label: "Hipercard",
    art: (
      <>
        <rect x="2" y="4" width="44" height="24" rx="4" fill="#B3131B" />
        <text x="24" y="20" {...WORDMARK} fontSize="10" letterSpacing="0.2" fill="#FFFFFF">
          Hiper
        </text>
      </>
    ),
  },
  {
    id: "diners",
    label: "Diners Club",
    art: (
      <>
        <circle cx="24" cy="16" r="11" fill="#0079BE" />
        <circle cx="24" cy="16" r="6.5" fill="#FFFFFF" />
        <rect x="21" y="9.5" width="6" height="13" fill="#0079BE" />
      </>
    ),
  },
  {
    id: "discover",
    label: "Discover",
    art: (
      <>
        <text x="20" y="19.5" {...WORDMARK} fontSize="7" letterSpacing="0.1" fill="#2B2B2B">
          DISCOVER
        </text>
        <circle cx="42" cy="17" r="3.4" fill="#F58220" />
      </>
    ),
  },
  {
    id: "aura",
    label: "Aura",
    art: (
      <>
        <rect x="2" y="4" width="44" height="24" rx="4" fill="#5B2D8E" />
        <text x="24" y="20" {...WORDMARK} fontSize="10" letterSpacing="0.4" fill="#FFFFFF">
          Aura
        </text>
      </>
    ),
  },
  {
    id: "pix",
    label: "Pix",
    art: (
      <>
        {/* Losango vazado: é a silhueta pela qual o Pix é reconhecido, e
            aguenta bem os 28px sem virar borrão. */}
        <g transform="translate(24 16) rotate(45)">
          <rect x="-11" y="-11" width="22" height="22" rx="4.5" fill="#32BCAD" />
          <rect x="-4.5" y="-4.5" width="9" height="9" rx="2.2" fill="#FFFFFF" />
        </g>
      </>
    ),
  },
  {
    id: "boleto",
    label: "Boleto bancário",
    art: (
      <>
        {/* Código de barras: o jeito mais direto de dizer "boleto" sem texto. */}
        <g fill="#0A0A0A">
          <rect x="9" y="8" width="2" height="16" />
          <rect x="13" y="8" width="1" height="16" />
          <rect x="16" y="8" width="3" height="16" />
          <rect x="21" y="8" width="1" height="16" />
          <rect x="24" y="8" width="2" height="16" />
          <rect x="28" y="8" width="1" height="16" />
          <rect x="31" y="8" width="3" height="16" />
          <rect x="36" y="8" width="1" height="16" />
          <rect x="39" y="8" width="2" height="16" />
        </g>
      </>
    ),
  },
];
