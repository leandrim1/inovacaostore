import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, MessageCircle, RefreshCw, ShieldCheck, Tag, Truck } from "lucide-react";
import { Seo } from "../components/seo/Seo";
import { useProduct } from "../hooks/useProduct";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { PriceTag } from "../components/ui/PriceTag";
import { StarRating } from "../components/ui/StarRating";
import { QuantityStepper } from "../components/ui/QuantityStepper";
import { GaleriaProduto } from "../components/product/GaleriaProduto";
import { BarraDeCompra } from "../components/mobile/BarraDeCompra";
import { Mobile3DViewer } from "../components/mobile/Mobile3DViewer";
import { BotaoFavorito } from "../components/ui/BotaoFavorito";
import { formatBRL } from "../lib/format";
import { celebrarAdicao } from "../lib/vooAoCarrinho";
import { ProductCard } from "../components/product/ProductCard";
import { Reveal } from "../components/ui/Reveal";
import { useCart } from "../context/CartContext";
import { formatInstallments } from "../lib/format";
import { buildWhatsAppLink, STORE } from "../data/store";
import { useSiteSettings } from "../hooks/useSiteSettings";
import NotFoundPage from "./NotFoundPage";

export default function ProductPage() {
  const { slug = "" } = useParams();
  const { data: product, isLoading, isError } = useProduct(slug);
  const { addItem } = useCart();
  const { data: categories } = useCategories();
  const { data: settings } = useSiteSettings();
  const { data: sameCategoryProducts = [] } = useProducts({ category: product?.category });

  const [activeImage, setActiveImage] = useState(0);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [ver3d, setVer3d] = useState(false);
  const fotoAtualRef = useRef<HTMLDivElement>(null);
  const tamanhosRef = useRef<HTMLDivElement>(null);
  const trocarImagem = useCallback((i: number) => setActiveImage(i), []);

  useEffect(() => {
    if (!product) return;
    const firstInStock = product.variants.find((v) => v.stock > 0);
    setColor(firstInStock?.color ?? product.colors[0]?.name ?? "");
    setSize(firstInStock?.size ?? product.sizes[0] ?? "");
    setActiveImage(0);
    setQuantity(1);
  }, [product]);

  const jsonLd = useMemo(() => {
    if (!product) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      sku: product.sku,
      offers: {
        "@type": "Offer",
        priceCurrency: "BRL",
        price: product.price.toFixed(2),
        availability: product.comingSoon
          ? "https://schema.org/PreOrder"
          : "https://schema.org/InStock",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      },
    };
  }, [product]);

  if (isLoading) {
    return <div className="container-page py-32 text-center text-neutral-400">Carregando produto…</div>;
  }

  if (isError || !product) return <NotFoundPage />;

  const category = categories?.find((c) => c.slug === product.category);
  const related = sameCategoryProducts.filter((p) => p.id !== product.id).slice(0, 4);

  const selectedVariant = product.variants.find((v) => v.color === color && v.size === size);
  const variantStock = selectedVariant?.stock ?? 0;
  const hasAnyStock = product.variants.some((v) => v.stock > 0);
  const lowStock = variantStock > 0 && variantStock <= 3;
  const clampedQuantity = Math.min(quantity, Math.max(1, variantStock));

  const handleAddToCart = () => {
    if (!selectedVariant || selectedVariant.stock <= 0) {
      // Barra de compra sem tamanho disponível: leva até a escolha e chama a atenção.
      tamanhosRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      tamanhosRef.current?.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }],
        { duration: 320, easing: "ease-in-out" },
      );
      return;
    }
    addItem(product, { variantId: selectedVariant.id, color, size, quantity: clampedQuantity, abrirCarrinho: false });
    celebrarAdicao(fotoAtualRef.current, {
      nome: product.name,
      imagem: product.imageDetails[activeImage]?.url ?? product.imageDetails[0]?.url,
      detalhe: [size, product.colors.length > 1 ? color : "", clampedQuantity > 1 ? `${clampedQuantity} un.` : ""]
        .filter(Boolean)
        .join(" · "),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Frente = foto escolhida; costas = a seguinte (ou a etiqueta da loja).
  const fotoFrente = product.imageDetails[activeImage] ?? product.imageDetails[0];
  const fotoCostas = product.imageDetails.length > 1 ? product.imageDetails[(activeImage + 1) % product.imageDetails.length] : undefined;
  const produto3d = fotoFrente
    ? {
        id: product.id,
        slug: product.slug,
        nome: product.name,
        preco: formatBRL(product.price),
        imagem: fotoFrente.url,
        verso: fotoCostas?.url,
        focoX: fotoFrente.desktopSettings?.positionX ?? 50,
        focoY: fotoFrente.desktopSettings?.positionY ?? 50,
      }
    : null;

  return (
    <>
      <Seo
        title={product.name}
        description={product.description}
        jsonLd={jsonLd}
      />

      <div className="container-page py-6 sm:py-10">
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-neutral-400">
          <Link to="/" className="hover:text-brand-ink">Início</Link>
          <ChevronRight size={12} />
          <Link to={`/categoria/${product.category}`} className="hover:text-brand-ink">
            {category?.name}
          </Link>
          <ChevronRight size={12} />
          <span className="text-neutral-600">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
            {/* Desliza, amplia e abre o "Ver em 3D" — o único 3D da página, que
                existe para mostrar as costas da peça. */}
            <GaleriaProduto
              imagens={product.imageDetails}
              nome={product.name}
              ativa={activeImage}
              onTrocar={trocarImagem}
              onVer3D={() => setVer3d(true)}
              fotoAtualRef={fotoAtualRef}
            />
          </div>

          <div>
            <span className="rotulo text-neutral-500">{category?.name}</span>
            <div className="mt-1.5 flex items-start justify-between gap-3">
              <h1 className="font-display text-[2.5rem] leading-[0.9] text-brand-ink sm:text-5xl">{product.name}</h1>
              <BotaoFavorito produtoId={product.id} nome={product.name} tom="solido" className="-mr-1 -mt-1 hidden lg:grid" />
            </div>

            <div className="mt-3 flex items-center gap-3">
              <StarRating rating={product.rating} reviewCount={product.reviewCount} />
            </div>

            <div className="mt-5">
              <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
              <p className="mt-1.5 text-sm text-neutral-500">
                ou {formatInstallments(product.price, product.installmentsMax)}
              </p>
              {/* O PriceTag já mostra o riscado e o selo. Aqui dizemos QUAL
                  promoção está valendo e até quando — a informação que decide
                  a compra por impulso. */}
              {product.promotion && (
                <p className="mt-3 inline-flex flex-wrap items-center gap-2 border-l-2 border-brand-yellow bg-brand-yellow/10 px-3 py-2 text-sm text-brand-ink">
                  <Tag size={14} className="text-brand-yellow-dark" aria-hidden />
                  <span className="font-medium">{product.promotion.title || "Promoção"}</span>
                  {product.promotion.endsAt && (
                    <span className="text-xs text-neutral-600">
                      até {new Date(product.promotion.endsAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </p>
              )}
            </div>

            {product.comingSoon ? (
              <div className="mt-6 rounded-[3px] bg-neutral-100 p-4 text-sm text-neutral-600">
                Esta peça chega em breve à loja. Fale conosco pelo WhatsApp para
                ser avisado assim que estiver disponível.
              </div>
            ) : (
              <>
                <div className="mt-7">
                  <p className="mb-2.5 text-sm font-medium text-brand-ink">
                    Cor: <span className="font-normal text-neutral-500">{color}</span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setColor(c.name)}
                        title={c.name}
                        aria-pressed={color === c.name}
                        aria-label={`Cor ${c.name}`}
                        className={`h-10 w-10 rounded-full border border-black/10 ring-1 ring-offset-[3px] transition-shadow ${
                          color === c.name ? "ring-brand-ink" : "ring-transparent hover:ring-black/25"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-6" ref={tamanhosRef}>
                  <p className="mb-2.5 text-sm font-medium text-brand-ink">Tamanho</p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => {
                      const sizeStock = product.variants.find((v) => v.color === color && v.size === s)?.stock ?? 0;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSize(s)}
                          aria-pressed={size === s}
                          disabled={sizeStock <= 0}
                          className={`flex h-12 min-w-12 items-center justify-center rounded-[3px] border px-3 text-sm font-semibold transition-colors duration-150 ${
                            size === s
                              ? "border-brand-ink bg-brand-ink text-white"
                              : sizeStock <= 0
                                ? "border-black/10 text-neutral-300 line-through"
                                : "border-black/20 bg-white text-neutral-700 hover:border-brand-ink"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="mt-4 text-sm">
                  {variantStock <= 0 ? (
                    <span className="font-medium text-red-600">
                      {hasAnyStock ? "Sem estoque para essa combinação" : "Sem estoque"}
                    </span>
                  ) : lowStock ? (
                    <span className="font-medium text-red-600">
                      Apenas {variantStock} unidades em estoque
                    </span>
                  ) : (
                    <span className="text-green-700">Em estoque</span>
                  )}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <QuantityStepper quantity={clampedQuantity} onChange={setQuantity} max={Math.max(1, variantStock)} />
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={variantStock <= 0}
                    className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-10"
                  >
                    {added ? "Adicionado!" : "Adicionar ao carrinho"}
                  </button>
                </div>
              </>
            )}

            <a
              href={buildWhatsAppLink(
                settings.whatsappNumber,
                `Olá! Tenho uma dúvida sobre o produto "${product.name}" (${STORE.name}).`,
              )}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center gap-2 text-sm font-medium text-green-700 hover:underline"
            >
              <MessageCircle size={16} />
              Tirar dúvidas pelo WhatsApp
            </a>

            <div className="mt-8 grid grid-cols-1 gap-3 border-y border-brand-ink/10 py-4 text-xs text-neutral-600 sm:grid-cols-3 sm:divide-x sm:divide-brand-ink/10 sm:gap-0">
              <div className="flex items-center gap-2 sm:px-4 sm:first:pl-0">
                <Truck size={16} className="text-brand-yellow-dark" /> Frete grátis acima de R$ 299
              </div>
              <div className="flex items-center gap-2 sm:px-4">
                <RefreshCw size={16} className="text-brand-yellow-dark" /> Troca em até 30 dias
              </div>
              <div className="flex items-center gap-2 sm:px-4">
                <ShieldCheck size={16} className="text-brand-yellow-dark" /> Compra 100% segura
              </div>
            </div>

            <div className="mt-8 border-t border-brand-ink/10 pt-6">
              <h2 className="mb-2 font-display text-lg tracking-wide">Descrição</h2>
              <p className="text-sm leading-relaxed text-neutral-600">{product.description}</p>
              <ul className="mt-4 flex flex-col gap-1.5 text-sm text-neutral-600">
                {product.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-ink" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {!product.comingSoon && (
          <BarraDeCompra
            produtoId={product.id}
            nome={product.name}
            preco={product.price}
            rotulo={variantStock <= 0 ? "Escolher tamanho" : added ? "Adicionado!" : "Adicionar"}
            detalhe={variantStock > 0 ? size : undefined}
            desabilitado={!hasAnyStock}
            onAdicionar={handleAddToCart}
          />
        )}
        <Mobile3DViewer aberto={ver3d} produto={produto3d} onFechar={() => setVer3d(false)} />

        {related.length > 0 && (
          <section className="mt-20">
            <Reveal>
              <div className="mb-8 border-t border-brand-ink/15 pt-5">
                <p className="rotulo text-neutral-500">Combine com</p>
                <h2 className="section-title mt-2">Você também pode gostar</h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
