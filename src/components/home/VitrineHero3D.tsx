import { Component, Suspense, lazy, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../../hooks/useProducts";
import { useExperiencia3D } from "../../lib/experiencia3d";
import { formatBRL } from "../../lib/format";
import type { ProdutoVitrine } from "../three/VitrineHero";

// O único ponto que puxa three/R3F/drei: vira um chunk separado, baixado só
// quando este componente decide montar a cena.
const VitrineHero = lazy(() => import("../three/VitrineHero"));

/**
 * Porteiro da vitrine 3D do hero. Decide SE e QUANDO a cena entra:
 * - nunca no nível "off" (celular, menos movimento, aparelho fraco, sem WebGL);
 * - só depois que a página terminou de carregar e o navegador ficou ocioso —
 *   a foto e o título do hero (o que o visitante vê primeiro) nunca disputam
 *   rede ou CPU com o Three.js;
 * - parada (sem render) quando o hero sai da tela.
 * Se o chunk falhar ao baixar ou o WebGL cair, a cena some e o hero continua
 * exatamente como era antes dela.
 */
export function VitrineHero3D({ secao }: { secao: RefObject<HTMLElement | null> }) {
  const { webgl } = useExperiencia3D();
  const navigate = useNavigate();
  // Mesma consulta da seção "Em destaque" — sai do cache, sem requisição extra.
  const { data: destaques = [] } = useProducts({ featured: true, limit: 8 });
  const [liberada, setLiberada] = useState(false);
  const [naTela, setNaTela] = useState(true);
  const [pronta, setPronta] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const rolagem = useRef(0);

  const produtos = useMemo<ProdutoVitrine[]>(
    () =>
      destaques
        .filter((p) => p.imageDetails[0] && !p.comingSoon)
        .slice(0, 3)
        .map((p) => ({
          id: p.id,
          slug: p.slug,
          nome: p.name,
          preco: formatBRL(p.price),
          imagem: p.imageDetails[0].url,
          focoX: p.imageDetails[0].desktopSettings?.positionX ?? 50,
          focoY: p.imageDetails[0].desktopSettings?.positionY ?? 50,
        })),
    [destaques],
  );

  useEffect(() => {
    if (webgl === "off") return;
    let cancelado = false;
    let ocioso: number | undefined;
    let espera: ReturnType<typeof setTimeout> | undefined;
    const liberar = () => {
      if (!cancelado) setLiberada(true);
    };
    const agendar = () => {
      if ("requestIdleCallback" in window) ocioso = window.requestIdleCallback(liberar, { timeout: 2500 });
      else espera = setTimeout(liberar, 1200);
    };
    if (document.readyState === "complete") agendar();
    else window.addEventListener("load", agendar, { once: true });
    return () => {
      cancelado = true;
      window.removeEventListener("load", agendar);
      if (ocioso !== undefined) window.cancelIdleCallback(ocioso);
      if (espera !== undefined) clearTimeout(espera);
    };
  }, [webgl]);

  useEffect(() => {
    const el = secao.current;
    if (!el || webgl === "off") return;
    const observador = new IntersectionObserver(([e]) => setNaTela(e.isIntersecting), { rootMargin: "80px" });
    observador.observe(el);
    const medir = () => {
      const caixa = el.getBoundingClientRect();
      rolagem.current = Math.min(1, Math.max(0, -caixa.top / Math.max(1, caixa.height)));
    };
    medir();
    window.addEventListener("scroll", medir, { passive: true });
    return () => {
      observador.disconnect();
      window.removeEventListener("scroll", medir);
    };
  }, [secao, webgl]);

  if (webgl === "off" || !liberada || falhou) return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-[5] transition-opacity duration-[1400ms] ease-out ${
        pronta ? "opacity-100" : "opacity-0"
      }`}
    >
      <LimiteDaCena onErro={() => setFalhou(true)}>
        <Suspense fallback={null}>
          <VitrineHero
            produtos={produtos}
            nivel={webgl}
            eventSource={secao}
            rolagem={rolagem}
            ativo={naTela}
            onEscolher={(slug) => navigate(`/produto/${slug}`)}
            onPronto={() => setPronta(true)}
            onFalha={() => setFalhou(true)}
          />
        </Suspense>
      </LimiteDaCena>
    </div>
  );
}

/** Qualquer erro dentro da cena (chunk que não baixou, shader que não compilou) só a remove. */
class LimiteDaCena extends Component<{ children: ReactNode; onErro: () => void }, { erro: boolean }> {
  state = { erro: false };

  static getDerivedStateFromError() {
    return { erro: true };
  }

  componentDidCatch() {
    this.props.onErro();
  }

  render() {
    return this.state.erro ? null : this.props.children;
  }
}
