import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, Upload, X } from "lucide-react";
import {
  useAdminProduct,
  useCreateProduct,
  useDeleteProductImage,
  useUpdateProduct,
  useUploadProductImages,
  type AdminProductInput,
} from "../../hooks/admin/useAdminProducts";
import { useAdminCategories } from "../../hooks/admin/useAdminCategories";
import { formatBRL } from "../../lib/format";

const TAG_OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "mais-vendido", label: "Mais vendido" },
  { value: "importado", label: "Importado" },
  { value: "ultimas-unidades", label: "Últimas unidades" },
];

interface VariantRow {
  id?: string;
  color: string;
  colorHex: string;
  size: string;
  stock: number;
  sku: string;
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const { data: product, isLoading: isLoadingProduct } = useAdminProduct(id);
  const { data: categories = [] } = useAdminCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const uploadImages = useUploadProductImages();
  const deleteImage = useDeleteProductImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [featuresText, setFeaturesText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [volumeM3, setVolumeM3] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);
  const [variants, setVariants] = useState<VariantRow[]>([
    { color: "", colorHex: "#141414", size: "", stock: 0, sku: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setSlug(product.slug);
    setDescription(product.description);
    setFeaturesText(product.features.join("\n"));
    setTags(product.tags);
    setPrice(String(product.price));
    setCompareAtPrice(product.compareAtPrice ? String(product.compareAtPrice) : "");
    setCostPrice(product.costPrice ? String(product.costPrice) : "");
    setWeightKg(product.weightKg ? String(product.weightKg) : "");
    setVolumeM3(product.volumeM3 ? String(product.volumeM3) : "");
    setSku(product.sku);
    setCategoryId(product.categoryId);
    setFeatured(product.featured);
    setActive(product.active);
    setVariants(
      product.variants.length
        ? product.variants.map((v) => ({
            id: v.id,
            color: v.color,
            colorHex: v.colorHex,
            size: v.size,
            stock: v.stock,
            sku: v.sku ?? "",
          }))
        : [{ color: "", colorHex: "#141414", size: "", stock: 0, sku: "" }],
    );
  }, [product]);

  useEffect(() => {
    if (!isEditing && categories.length && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId, isEditing]);

  function toggleTag(value: string) {
    setTags((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));
  }

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { color: "", colorHex: "#141414", size: "", stock: 0, sku: "" }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validVariants = variants.filter((v) => v.color.trim() && v.size.trim());
    const partiallyFilled = variants.some(
      (v) => (v.color.trim() || v.size.trim()) && !(v.color.trim() && v.size.trim()),
    );

    if (partiallyFilled) {
      setError("Uma ou mais variações estão incompletas: informe cor e tamanho, ou remova a linha.");
      return;
    }
    if (validVariants.length === 0) {
      setError("Adicione pelo menos uma variação (cor, tamanho e estoque) antes de salvar.");
      return;
    }

    const payload: AdminProductInput = {
      name,
      slug: slug.trim() || undefined,
      description,
      features: featuresText.split("\n").map((f) => f.trim()).filter(Boolean),
      tags: tags as AdminProductInput["tags"],
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      costPrice: costPrice ? Number(costPrice) : 0,
      weightKg: weightKg ? Number(weightKg) : 0,
      volumeM3: volumeM3 ? Number(volumeM3) : 0,
      sku,
      featured,
      active,
      categoryId,
      variants: validVariants.map((v) => ({
        id: v.id,
        color: v.color.trim(),
        colorHex: v.colorHex,
        size: v.size.trim(),
        stock: Number(v.stock) || 0,
        sku: v.sku.trim() || undefined,
      })),
    };

    try {
      if (isEditing && id) {
        await updateProduct.mutateAsync({ id, data: payload });
        navigate("/admin/produtos");
      } else {
        const created = await createProduct.mutateAsync(payload);
        navigate(`/admin/produtos/${created.id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o produto.");
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!id || !e.target.files?.length) return;
    setImageError(null);
    try {
      await uploadImages.mutateAsync({ id, files: Array.from(e.target.files) });
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Não foi possível enviar as imagens.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!id) return;
    await deleteImage.mutateAsync({ productId: id, imageId });
  }

  if (isEditing && isLoadingProduct) {
    return <p className="text-neutral-400">Carregando produto…</p>;
  }

  const isSaving = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl tracking-wide">
        {isEditing ? "Editar produto" : "Novo produto"}
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">DADOS GERAIS</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Nome do produto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
              />
              <input
                placeholder="Slug (URL) — gerado automaticamente se vazio"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="col-span-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
              />
              <textarea
                placeholder="Descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="col-span-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
              />
              <textarea
                placeholder={"Características (uma por linha)\nEx: 100% algodão"}
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                rows={4}
                className="col-span-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
              />
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-sm tracking-widest text-neutral-500">
                CORES, TAMANHOS E ESTOQUE
              </h2>
              <button type="button" onClick={addVariant} className="flex items-center gap-1.5 text-sm font-medium text-brand-ink">
                <Plus size={14} /> Adicionar variação
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-6 items-center gap-2 sm:grid-cols-12">
                  <input
                    placeholder="Cor (ex: Preto)"
                    value={v.color}
                    onChange={(e) => updateVariant(i, { color: e.target.value })}
                    className="col-span-3 rounded-lg border border-black/10 px-2.5 py-2 text-sm outline-none focus:border-brand-ink sm:col-span-3"
                  />
                  <input
                    type="color"
                    value={v.colorHex}
                    onChange={(e) => updateVariant(i, { colorHex: e.target.value })}
                    className="col-span-1 h-9 w-full rounded-lg border border-black/10 sm:col-span-1"
                  />
                  <input
                    placeholder="Tamanho"
                    value={v.size}
                    onChange={(e) => updateVariant(i, { size: e.target.value })}
                    className="col-span-2 rounded-lg border border-black/10 px-2.5 py-2 text-sm outline-none focus:border-brand-ink sm:col-span-2"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Estoque"
                    value={v.stock}
                    onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
                    className="col-span-2 rounded-lg border border-black/10 px-2.5 py-2 text-sm outline-none focus:border-brand-ink sm:col-span-2"
                  />
                  <input
                    placeholder="SKU da variação (opcional)"
                    value={v.sku}
                    onChange={(e) => updateVariant(i, { sku: e.target.value })}
                    className="col-span-3 rounded-lg border border-black/10 px-2.5 py-2 text-sm outline-none focus:border-brand-ink sm:col-span-3"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="col-span-1 flex items-center justify-center rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-neutral-400">
              Remover uma variação existente apenas zera o estoque dela, preservando o histórico de
              pedidos já realizados.
            </p>
          </section>

          {isEditing && (
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">IMAGENS</h2>
              {imageError && <p className="mb-3 text-sm text-red-600">{imageError}</p>}
              <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {product?.imageDetails.map((img) => (
                  <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="product-images-input"
              />
              <label
                htmlFor="product-images-input"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-black/20 px-4 py-3 text-sm text-neutral-500 hover:border-brand-ink hover:text-brand-ink"
              >
                <Upload size={16} />
                {uploadImages.isPending ? "Enviando…" : "Enviar imagens"}
              </label>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">PREÇO E SKU</h2>
            <div className="flex flex-col gap-3">
              <input
                required
                type="number"
                step="0.01"
                min={0}
                placeholder="Preço"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
              />
              <input
                type="number"
                step="0.01"
                min={0}
                placeholder="Preço promocional (De: / riscado)"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
              />
              {price && compareAtPrice && Number(compareAtPrice) > Number(price) && (
                <p className="text-xs text-neutral-400">
                  De {formatBRL(Number(compareAtPrice))} por {formatBRL(Number(price))}
                </p>
              )}
              <label className="text-xs font-medium text-neutral-500">
                Custo do produto (R$)
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                />
              </label>
              {price && costPrice && Number(price) > 0 && (
                <p className="text-xs text-neutral-400">
                  Margem estimada: {(((Number(price) - Number(costPrice)) / Number(price)) * 100).toFixed(1)}%
                </p>
              )}
              <p className="-mt-1 text-xs text-neutral-400">
                Usado para calcular o lucro no dashboard de vendas. Deixe em 0 se não quiser acompanhar o lucro
                deste produto.
              </p>
              <input
                required
                placeholder="SKU"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
              />
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">
              PESO E VOLUME
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-medium text-neutral-500">
                Peso (kg)
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="0"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                />
              </label>
              <label className="text-xs font-medium text-neutral-500">
                Volume (m³)
                <input
                  type="number"
                  step="0.001"
                  min={0}
                  placeholder="0"
                  value={volumeM3}
                  onChange={(e) => setVolumeM3(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Usados para calcular um adicional de frete quando o pedido excede os limites livres
              configurados na página de Frete. Deixe em 0 se não afetar o frete.
            </p>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">CATEGORIA</h2>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
            >
              <option value="" disabled>
                Selecione
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">VISIBILIDADE</h2>
            <label className="mb-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-brand-ink" />
              Produto ativo (visível na loja)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 accent-brand-ink"
              />
              Marcar como destaque (aparece na home)
            </label>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">ETIQUETAS</h2>
            <div className="flex flex-col gap-2">
              {TAG_OPTIONS.map((t) => (
                <label key={t.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tags.includes(t.value)}
                    onChange={() => toggleTag(t.value)}
                    className="h-4 w-4 accent-brand-ink"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </section>

          {error && <p className="alert-error">{error}</p>}

          <button type="submit" disabled={isSaving} className="btn-primary w-full disabled:opacity-60">
            {isSaving ? "Salvando…" : isEditing ? "Salvar alterações" : "Criar produto"}
          </button>
        </div>
      </form>
    </div>
  );
}
