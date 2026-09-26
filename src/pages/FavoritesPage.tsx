import { useEffect, useMemo } from "react";
import { Heart } from "lucide-react";
import { Seo } from "../components/seo/Seo";
import { ProductCard } from "../components/product/ProductCard";
import { Reveal } from "../components/ui/Reveal";
import { Button3D } from "../components/ui/Button3D";
import { AnimatedSection } from "../components/ui/AnimatedSection";
import { useProducts } from "../hooks/useProducts";
import { useFavoritos } from "../lib/favoritos";

export default function FavoritesPage() {
  const { ids, manterSomente } = useFavoritos();
  const { data: produtos = [], isLoading, isSuccess } = useProducts({ ids, limit: 60 });

  // A lista guarda só ids: produto desativado ou excluído sai dela aqui.
  useEffect(() => {
    if (isSuccess && ids.length > 0) manterSomente(produtos.map((p) => p.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, produtos]);

  // Mais recente primeiro, na ordem em que a pessoa favoritou.
  const ordenados = useMemo(
    () => [...produtos].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)),
    [produtos, ids],
  );

  return (
    <>
      <Seo title="Favoritos" description="As peças que você salvou na Inovação Store." />
      <AnimatedSection tom="creme" className="min-h-[60vh] py-8 sm:py-14">
        <div className="container-page">
          <Reveal className="mb-8">
            <div className="section-eyebrow text-brand-yellow-dark">
              <span className="h-px w-8 bg-brand-ink/20" aria-hidden />
              Salvos
            </div>
            <h1 className="section-title mt-3">Favoritos</h1>
            <p className="mt-2 text-sm text-neutral-500">
              {ids.length === 0
                ? "Toque no coração de uma peça para guardá-la aqui."
                : `${ids.length} ${ids.length === 1 ? "peça salva" : "peças salvas"} neste aparelho.`}
            </p>
          </Reveal>

          {ids.length === 0 ? (
            <Reveal className="mx-auto flex max-w-sm flex-col items-center gap-5 py-10 text-center">
              <span className="grid h-24 w-24 place-items-center rounded-[28px] bg-gradient-to-b from-white to-neutral-100 shadow-[inset_0_1px_0_#fff,0_18px_30px_-16px_rgba(0,0,0,0.45),0_3px_0_rgba(10,10,10,0.08)] ring-1 ring-brand-ink/10">
                <Heart size={38} className="fill-brand-yellow text-brand-ink" strokeWidth={1.6} />
              </span>
              <p className="text-neutral-600">Você ainda não salvou nenhuma peça.</p>
              <Button3D to="/destaques" tamanho="lg">
                Explorar produtos
              </Button3D>
            </Reveal>
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {ids.slice(0, 4).map((id) => (
                <div key={id} className="aspect-[4/6] animate-pulse rounded-2xl bg-neutral-200/70" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {ordenados.map((produto, i) => (
                <Reveal key={produto.id} delay={(i % 4) * 0.05}>
                  <ProductCard product={produto} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </AnimatedSection>
    </>
  );
}
