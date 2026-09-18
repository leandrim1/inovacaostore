import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, X } from "lucide-react";
import {
  useAdminPromotion,
  useCreatePromotion,
  useDeletePromotionImage,
  useUpdatePromotion,
  useUploadPromotionImage,
  type PromotionInput,
} from "../../hooks/admin/useAdminPromotions";

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
  const [endsAt, setEndsAt] = useState("");
  const [active, setActive] = useState(true);
  const [order, setOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (!promotion) return;
    setTitle(promotion.title);
    setHighlight(promotion.highlight);
    setDescription(promotion.description);
    setCtaLabel(promotion.ctaLabel);
    setCtaUrl(promotion.ctaUrl);
    setEndsAt(toDatetimeLocal(promotion.endsAt));
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
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      active,
      order: Number(order) || 0,
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
                className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
              />
              <input
                required
                placeholder="Destaque (ex: 20% OFF)"
                value={highlight}
                onChange={(e) => setHighlight(e.target.value)}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
              />
              <textarea
                placeholder="Descrição (ex: Em toda a loja, por tempo limitado!)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  placeholder="Texto do botão"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                />
                <input
                  placeholder="Link do botão (ex: /categoria/moletons)"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                />
              </div>
            </div>
          </section>

          {isEditing && (
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">IMAGEM DE FUNDO</h2>
              {imageError && <p className="mb-3 text-sm text-red-600">{imageError}</p>}
              {promotion?.imageUrl ? (
                <div className="group relative mb-4 aspect-[16/7] overflow-hidden rounded-lg bg-neutral-100">
                  <img src={promotion.imageUrl} alt="" className="h-full w-full object-cover" />
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
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">CONTAGEM REGRESSIVA</h2>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Termina em (opcional)</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
            />
            <p className="mt-1.5 text-xs text-neutral-400">
              Deixe em branco para uma promoção sem contagem regressiva.
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
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
            />
          </section>

          {error && <p className="alert-error">{error}</p>}

          <button type="submit" disabled={isSaving} className="btn-primary w-full disabled:opacity-60">
            {isSaving ? "Salvando…" : isEditing ? "Salvar alterações" : "Criar promoção"}
          </button>
        </div>
      </form>
    </div>
  );
}
