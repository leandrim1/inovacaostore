import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Crop, Search, Upload, X } from "lucide-react";
import {
  useAdminPromotion,
  useCreatePromotion,
  useDeletePromotionImage,
  useUpdatePromotion,
  useUploadPromotionImage,
  type PromotionInput,
} from "../../hooks/admin/useAdminPromotions";
import { ImagePositionEditor } from "../../components/admin/ImagePositionEditor";
import { useAdminProducts } from "../../hooks/admin/useAdminProducts";
import { useCategories } from "../../hooks/useCategories";
import { formatBRL } from "../../lib/format";

type DiscountScope = "all" | "category" | "products";

const ESCOPOS: { valor: DiscountScope; rotulo: string; ajuda: string }[] = [
  { valor: "all", rotulo: "Toda a loja", ajuda: "Todos os produtos ativos entram na promoção." },
  { valor: "category", rotulo: "Categoria específica", ajuda: "Só os produtos da categoria escolhida." },
  { valor: "products", rotulo: "Produtos específicos", ajuda: "Só os produtos que você marcar abaixo." },
];

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AdminPromotionFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const { data: promotion, isLoading: isLoadingPromotion } = useAdminPromotion(id);
  const { data: categorias = [] } = useCategories();
  const { data: produtos = [] } = useAdminProducts();
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const uploadImage = useUploadPromotionImage();
  const deleteImage = useDeletePromotionImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [highlight, setHighlight] = useState("");
  const [description, setDescription] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Compre agora");
  const [ctaUrl, setCtaUrl] = useState("/");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("0");
  const [discountScope, setDiscountScope] = useState<DiscountScope>("all");
  const [categoryId, setCategoryId] = useState("");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [active, setActive] = useState(true);
  const [order, setOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isAdjustingImage, setIsAdjustingImage] = useState(false);

  useEffect(() => {
    if (!promotion) return;
    setTitle(promotion.title);
    setHighlight(promotion.highlight);
    setDescription(promotion.description);
    setCtaLabel(promotion.ctaLabel);
    setCtaUrl(promotion.ctaUrl);
    setStartsAt(toDatetimeLocal(promotion.startsAt));
    setEndsAt(toDatetimeLocal(promotion.endsAt));
    setDiscountType(promotion.discountType);
    setDiscountValue(String(promotion.discountValue));
    setDiscountScope(promotion.discountScope);
    setCategoryId(promotion.categoryId ?? "");
    setProductIds(promotion.productIds ?? []);
    setActive(promotion.active);
    setOrder(promotion.order);
  }, [promotion]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload: PromotionInput = {
      title,
      highlight,
      description,
      ctaLabel,
      ctaUrl,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      active,
      order: Number(order) || 0,
      discountType,
      discountValue: Number(discountValue) || 0,
      discountScope,
      categoryId: discountScope === "category" ? categoryId || null : null,
      productIds: discountScope === "products" ? productIds : [],
    };

    try {
      if (isEditing && id) {
        await updatePromotion.mutateAsync({ id, data: payload });
        navigate("/admin/promocoes");
      } else {
        const created = await createPromotion.mutateAsync(payload);
        navigate(`/admin/promocoes/${created.id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a promoção.");
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!id || !file) return;
    setImageError(null);
    try {
      await uploadImage.mutateAsync({ id, file });
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Não foi possível enviar a imagem.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteImage() {
    if (!id) return;
    await deleteImage.mutateAsync(id);
  }

  // Um exemplo concreto vale mais que a regra escrita: mostra o efeito do
  // desconto sobre um produto de verdade que essa promoção vai atingir.
  const valorNum = Number(discountValue) || 0;
  const produtoExemplo = (() => {
    if (valorNum <= 0 || produtos.length === 0) return null;
    if (discountScope === "products") return produtos.find((p) => productIds.includes(p.id)) ?? null;
    if (discountScope === "category")
      return produtos.find((p) => p.categoryId === categoryId) ?? null;
    return produtos[0] ?? null;
  })();
  const precoExemplo = produtoExemplo
    ? (() => {
        const desconto = Math.min(
          discountType === "percent" ? (produtoExemplo.price * valorNum) / 100 : valorNum,
          produtoExemplo.price,
        );
        const abatido = Math.round(desconto * 100) / 100;
        return { de: produtoExemplo.price, por: Math.round((produtoExemplo.price - abatido) * 100) / 100, abatido };
      })()
    : null;

  const produtosFiltrados = buscaProduto.trim()
    ? produtos.filter((p) => p.name.toLowerCase().includes(buscaProduto.trim().toLowerCase()))
    : produtos;

  function alternarProduto(id: string) {
    setProductIds((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  }

  if (isEditing && isLoadingPromotion) {
    return <p className="text-neutral-400">Carregando…</p>;
  }

  const isSaving = createPromotion.isPending || updatePromotion.isPending;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl tracking-wide">
        {isEditing ? "Editar promoção" : "Nova promoção"}
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">CONTEÚDO</h2>
            <div className="grid grid-cols-1 gap-3">
              <input
                required
                placeholder="Título (ex: PROMOÇÃO IMPERDÍVEL)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="admin-input px-3 py-2"
              />
              <input
                required
                placeholder="Destaque (ex: 20% OFF)"
                value={highlight}
                onChange={(e) => setHighlight(e.target.value)}
                className="admin-input px-3 py-2"
              />
              <textarea
                placeholder="Descrição (ex: Em toda a loja, por tempo limitado!)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="admin-input px-3 py-2"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  placeholder="Texto do botão"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  className="admin-input px-3 py-2"
                />
                <input
                  placeholder="Link do botão (ex: /categoria/moletons)"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  className="admin-input px-3 py-2"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-1 font-display text-sm tracking-widest text-neutral-500">DESCONTO</h2>
            <p className="mb-4 text-xs leading-relaxed text-neutral-500">
              Deixe o valor em <strong>0</strong> para uma promoção apenas de banner, sem mexer em preço.
              O preço cadastrado do produto nunca é alterado — o desconto é calculado na hora e some
              sozinho quando a promoção acaba.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <label className="text-xs font-medium text-neutral-500">
                Valor do desconto
                <div className="mt-1 flex">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="admin-input w-full rounded-r-none px-3 py-2"
                  />
                  <span className="flex items-center rounded-r-lg border border-l-0 border-black/10 bg-neutral-50 px-3 text-sm text-neutral-500">
                    {discountType === "percent" ? "%" : "R$"}
                  </span>
                </div>
              </label>
              <label className="text-xs font-medium text-neutral-500 sm:self-end">
                Tipo
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
                  className="mt-1 w-full admin-input px-3 py-2 sm:w-44"
                >
                  <option value="percent">Percentual (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </label>
            </div>

            <fieldset className="mt-5">
              <legend className="mb-2 text-xs font-medium text-neutral-500">Aplicar desconto em</legend>
              <div className="flex flex-col gap-2">
                {ESCOPOS.map((escopo) => (
                  <label
                    key={escopo.valor}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors ${
                      discountScope === escopo.valor
                        ? "border-brand-ink bg-brand-cream"
                        : "border-black/10 hover:border-black/25"
                    }`}
                  >
                    <input
                      type="radio"
                      name="discountScope"
                      value={escopo.valor}
                      checked={discountScope === escopo.valor}
                      onChange={() => setDiscountScope(escopo.valor)}
                      className="mt-0.5 h-4 w-4 accent-brand-ink"
                    />
                    <span>
                      <span className="block text-sm font-medium text-brand-ink">{escopo.rotulo}</span>
                      <span className="block text-xs text-neutral-500">{escopo.ajuda}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {discountScope === "category" && (
              <label className="mt-4 block text-xs font-medium text-neutral-500">
                Categoria
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1 w-full admin-input px-3 py-2"
                >
                  <option value="">Selecionar categoria</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {discountScope === "products" && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500">
                    Produtos ({productIds.length} selecionado{productIds.length === 1 ? "" : "s"})
                  </span>
                  {productIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setProductIds([])}
                      className="text-xs text-neutral-500 underline hover:text-brand-ink"
                    >
                      limpar seleção
                    </button>
                  )}
                </div>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Buscar produto pelo nome"
                    value={buscaProduto}
                    onChange={(e) => setBuscaProduto(e.target.value)}
                    className="w-full admin-input py-2 pl-9 pr-3"
                  />
                </div>
                <ul className="max-h-72 overflow-y-auto rounded-xl border border-black/10 divide-y divide-black/5">
                  {produtosFiltrados.length === 0 && (
                    <li className="px-3 py-4 text-center text-xs text-neutral-400">
                      Nenhum produto encontrado.
                    </li>
                  )}
                  {produtosFiltrados.map((produto) => (
                    <li key={produto.id}>
                      <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 hover:bg-neutral-50">
                        <input
                          type="checkbox"
                          checked={productIds.includes(produto.id)}
                          onChange={() => alternarProduto(produto.id)}
                          className="h-4 w-4 accent-brand-ink"
                        />
                        <span className="flex-1 text-sm">{produto.name}</span>
                        <span className="text-xs text-neutral-500">{formatBRL(produto.price)}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {precoExemplo && produtoExemplo && (
              <div className="mt-5 rounded-xl bg-brand-cream p-4 ring-1 ring-brand-ink/10">
                <p className="mb-2 font-display text-xs tracking-widest text-neutral-500">
                  PRÉVIA · {produtoExemplo.name}
                </p>
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-sm text-neutral-400 line-through">{formatBRL(precoExemplo.de)}</span>
                  <span className="font-display text-2xl text-brand-ink">{formatBRL(precoExemplo.por)}</span>
                  <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-xs font-bold text-brand-ink">
                    -{Math.round((precoExemplo.abatido / precoExemplo.de) * 100)}%
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-neutral-500">
                  Economia de {formatBRL(precoExemplo.abatido)} por unidade.
                </p>
              </div>
            )}
          </section>

          {isEditing && (
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">IMAGEM DE FUNDO</h2>
              {imageError && <p className="mb-3 text-sm text-red-600">{imageError}</p>}
              {promotion?.imageUrl ? (
                <div className="group relative mb-4 aspect-[16/7] overflow-hidden rounded-lg bg-neutral-100">
                  <img src={promotion.imageUrl} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/50 to-transparent py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setIsAdjustingImage(true)}
                      className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-brand-ink hover:bg-white"
                    >
                      <Crop size={11} /> Ajustar
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <p className="mb-4 text-xs text-neutral-400">
                  Sem imagem, a promoção usa um fundo amarelo/preto padrão da loja.
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="promotion-image-input"
              />
              <label
                htmlFor="promotion-image-input"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-black/20 px-4 py-3 text-sm text-neutral-500 hover:border-brand-ink hover:text-brand-ink"
              >
                <Upload size={16} />
                {uploadImage.isPending ? "Enviando…" : promotion?.imageUrl ? "Trocar imagem" : "Enviar imagem"}
              </label>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">PERÍODO</h2>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Começa em (opcional)</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="mb-1.5 w-full admin-input px-3 py-2"
            />
            <p className="mb-4 text-xs text-neutral-400">
              Antes dessa data o banner não aparece e o desconto não é aplicado. Em branco, vale desde já.
            </p>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Termina em (opcional)</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full admin-input px-3 py-2"
            />
            <p className="mt-1.5 text-xs text-neutral-400">
              É desta data que sai a contagem regressiva do banner. Ao chegar a zero, o desconto some e os
              preços voltam ao normal sozinhos. Em branco, a promoção não tem prazo.
            </p>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">EXIBIÇÃO</h2>
            <label className="mb-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-brand-ink" />
              Promoção ativa (visível na home)
            </label>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Ordem no carrossel</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full admin-input px-3 py-2"
            />
          </section>

          {error && <p className="alert-error">{error}</p>}

          <button type="submit" disabled={isSaving} className="btn-primary w-full disabled:opacity-60">
            {isSaving ? "Salvando…" : isEditing ? "Salvar alterações" : "Criar promoção"}
          </button>
        </div>
      </form>

      {isAdjustingImage && promotion?.imageUrl && (
        <ImagePositionEditor
          src={promotion.imageUrl}
          alt=""
          desktopAspect={21 / 9}
          mobileAspect={9 / 10}
          initialDesktopSettings={promotion.desktopSettings}
          initialMobileSettings={promotion.mobileSettings}
          onClose={() => setIsAdjustingImage(false)}
          onSave={(data) => updatePromotion.mutateAsync({ id: promotion.id, data })}
        />
      )}
    </div>
  );
}
