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
            <p className="rotulo text-neutral-500">Salvos</p>
            <h1 className="section-title mt-2">Favoritos</h1>
            <p className="mt-2 text-sm text-neutral-500">
              {ids.length === 0
                ? "Toque no coração de uma peça para guardá-la aqui."
                : `${ids.length} ${ids.length === 1 ? "peça salva" : "peças salvas"} neste aparelho.`}
            </p>
          </Reveal>

          {ids.length === 0 ? (
            <Reveal className="flex max-w-sm flex-col items-start gap-4 border-t border-brand-ink/15 py-10">
              <Heart size={40} className="text-brand-ink/30" strokeWidth={1.4} aria-hidden />
              <p className="text-neutral-600">Você ainda não salvou nenhuma peça.</p>
              <Button3D to="/destaques" tamanho="lg">
                Explorar produtos
              </Button3D>
            </Reveal>
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
              {ids.slice(0, 4).map((id) => (
                <div key={id} className="aspect-[4/6] animate-pulse rounded-[3px] bg-neutral-200/70" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
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
