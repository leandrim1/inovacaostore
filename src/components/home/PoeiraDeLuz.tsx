/**
 * Versão leve da poeira luminosa da vitrine 3D, para onde a cena WebGL não
 * entra (celular, aparelho fraco): uma dúzia de pontos em CSS puro, animando
 * só `transform` e `opacity` — roda no compositor, sem JavaScript por quadro.
 * Quem pediu menos movimento não recebe nem isto (ver Hero).
 */
const PONTOS = [
  { x: 8, y: 22, t: 2.5, d: 0, v: 9 },
  { x: 18, y: 64, t: 1.5, d: 2.1, v: 11 },
  { x: 27, y: 38, t: 2, d: 4.3, v: 10 },
  { x: 36, y: 12, t: 1.5, d: 1.2, v: 12 },
  { x: 44, y: 52, t: 3, d: 3.4, v: 8 },
  { x: 55, y: 28, t: 1.5, d: 5.2, v: 13 },
  { x: 63, y: 70, t: 2, d: 0.7, v: 10 },
  { x: 71, y: 16, t: 2.5, d: 2.8, v: 9 },
  { x: 79, y: 46, t: 1.5, d: 4.9, v: 12 },
  { x: 86, y: 30, t: 2, d: 1.8, v: 11 },
  { x: 92, y: 60, t: 1.5, d: 3.9, v: 10 },
  { x: 50, y: 82, t: 2, d: 6.1, v: 9 },
];

export function PoeiraDeLuz() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" aria-hidden>
      {PONTOS.map((p, i) => (
        <span
          key={i}
          className="absolute animate-poeira rounded-full bg-brand-yellow shadow-[0_0_8px_2px_rgba(245,196,0,0.55)]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.t,
            height: p.t,
            animationDelay: `${p.d}s`,
            animationDuration: `${p.v}s`,
          }}
        />
      ))}
    </div>
  );
}
