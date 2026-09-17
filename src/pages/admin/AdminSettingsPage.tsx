import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import {
  useAdminGalleryImages,
  useAdminHeroImages,
  useAdminSettings,
  useDeleteGalleryImage,
  useDeleteHeroImage,
  useUpdateSettings,
  useUploadGalleryImages,
  useUploadHeroImages,
  type SiteSettingsInput,
} from "../../hooks/admin/useAdminSettings";

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useAdminSettings();
  const { data: heroImages = [] } = useAdminHeroImages();
  const { data: galleryImages = [] } = useAdminGalleryImages();
  const updateSettings = useUpdateSettings();
  const uploadHeroImages = useUploadHeroImages();
  const deleteHeroImage = useDeleteHeroImage();
  const uploadGalleryImages = useUploadGalleryImages();
  const deleteGalleryImage = useDeleteGalleryImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [heroEyebrow, setHeroEyebrow] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [heroCtaLabel, setHeroCtaLabel] = useState("");
  const [heroCtaUrl, setHeroCtaUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [announcementItem1, setAnnouncementItem1] = useState("");
  const [announcementItem2, setAnnouncementItem2] = useState("");
  const [announcementItem3, setAnnouncementItem3] = useState("");
  const [announcementItem4, setAnnouncementItem4] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setHeroEyebrow(settings.heroEyebrow);
    setHeroTitle(settings.heroTitle);
    setHeroDescription(settings.heroDescription);
    setHeroCtaLabel(settings.heroCtaLabel);
    setHeroCtaUrl(settings.heroCtaUrl);
    setWhatsappNumber(settings.whatsappNumber);
    setWhatsappMessage(settings.whatsappMessage);
    setContactEmail(settings.contactEmail);
    setAnnouncementItem1(settings.announcementItem1);
    setAnnouncementItem2(settings.announcementItem2);
    setAnnouncementItem3(settings.announcementItem3);
    setAnnouncementItem4(settings.announcementItem4);
  }, [settings]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const payload: SiteSettingsInput = {
      heroEyebrow,
      heroTitle,
      heroDescription,
      heroCtaLabel,
      heroCtaUrl,
      whatsappNumber: whatsappNumber.replace(/\D/g, ""),
      whatsappMessage,
      contactEmail,
      announcementItem1,
      announcementItem2,
      announcementItem3,
      announcementItem4,
    };

    try {
      await updateSettings.mutateAsync(payload);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar as configurações.");
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setImageError(null);
    try {
      await uploadHeroImages.mutateAsync(Array.from(e.target.files));
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Não foi possível enviar as imagens.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteImage(id: string) {
    setImageError(null);
    try {
      await deleteHeroImage.mutateAsync(id);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Não foi possível remover a imagem.");
    }
  }

  async function handleGalleryFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setGalleryError(null);
    try {
      await uploadGalleryImages.mutateAsync(Array.from(e.target.files));
    } catch (err) {
      setGalleryError(err instanceof Error ? err.message : "Não foi possível enviar as imagens.");
    } finally {
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  async function handleDeleteGalleryImage(id: string) {
    setGalleryError(null);
    try {
      await deleteGalleryImage.mutateAsync(id);
    } catch (err) {
      setGalleryError(err instanceof Error ? err.message : "Não foi possível remover a imagem.");
    }
  }

  if (isLoading) {
    return <p className="text-neutral-400">Carregando…</p>;
  }

  const isSaving = updateSettings.isPending;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl tracking-wide">Configurações do site</h1>
      <p className="-mt-4 text-sm text-neutral-500">
        Textos e contatos usados na página inicial e em todo o site. Alterações aqui aparecem
        para os clientes assim que salvar.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">
              BANNER PRINCIPAL (HERO)
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-xs font-medium text-neutral-500">
                Texto pequeno acima do título
                <input
                  required
                  value={heroEyebrow}
                  onChange={(e) => setHeroEyebrow(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                />
              </label>
              <label className="text-xs font-medium text-neutral-500">
                Título (use uma quebra de linha para dividir em duas linhas)
                <textarea
                  required
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                />
              </label>
              <label className="text-xs font-medium text-neutral-500">
                Descrição
                <textarea
                  required
                  value={heroDescription}
                  onChange={(e) => setHeroDescription(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-neutral-500">
                  Texto do botão
                  <input
                    required
                    value={heroCtaLabel}
                    onChange={(e) => setHeroCtaLabel(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                  />
                </label>
                <label className="text-xs font-medium text-neutral-500">
                  Link do botão (ex: /categoria/camisetas)
                  <input
                    required
                    value={heroCtaUrl}
                    onChange={(e) => setHeroCtaUrl(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-1 font-display text-sm tracking-widest text-neutral-500">
              CARROSSEL DE IMAGENS DO BANNER
            </h2>
            <p className="mb-4 text-xs text-neutral-400">
              Envie quantas fotos quiser — elas aparecem em rotação automática no banner principal.
              Sem nenhuma foto enviada, o site usa a imagem padrão da loja.
            </p>
            {imageError && <p className="mb-3 text-sm text-red-600">{imageError}</p>}
            {heroImages.length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {heroImages.map((img) => (
                  <div key={img.id} className="group relative aspect-[16/10] overflow-hidden rounded-lg bg-neutral-100">
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="hero-image-input"
            />
            <label
              htmlFor="hero-image-input"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-black/20 px-4 py-3 text-sm text-neutral-500 hover:border-brand-ink hover:text-brand-ink"
            >
              <Upload size={16} />
              {uploadHeroImages.isPending ? "Enviando…" : "Enviar imagens"}
            </label>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-1 font-display text-sm tracking-widest text-neutral-500">
              GALERIA DA LOJA
            </h2>
            <p className="mb-4 text-xs text-neutral-400">
              Fotos da loja, dos produtos ou até logos das marcas que você trabalha — elas aparecem
              numa faixa com efeito de movimento na página inicial. Sem nenhuma foto enviada, a seção
              fica escondida no site.
            </p>
            {galleryError && <p className="mb-3 text-sm text-red-600">{galleryError}</p>}
            {galleryImages.length > 0 && (
              <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {galleryImages.map((img) => (
                  <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleDeleteGalleryImage(img.id)}
                      className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryFileChange}
              className="hidden"
              id="gallery-image-input"
            />
            <label
              htmlFor="gallery-image-input"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-black/20 px-4 py-3 text-sm text-neutral-500 hover:border-brand-ink hover:text-brand-ink"
            >
              <Upload size={16} />
              {uploadGalleryImages.isPending ? "Enviando…" : "Enviar imagens"}
            </label>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">
              FAIXA DE ANÚNCIOS (topo do site)
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <input
                required
                placeholder="Item 1"
                value={announcementItem1}
                onChange={(e) => setAnnouncementItem1(e.target.value)}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
              />
              <input
                required
                placeholder="Item 2"
                value={announcementItem2}
                onChange={(e) => setAnnouncementItem2(e.target.value)}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
              />
              <input
                required
                placeholder="Item 3"
                value={announcementItem3}
                onChange={(e) => setAnnouncementItem3(e.target.value)}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
              />
              <input
                required
                placeholder="Item 4"
                value={announcementItem4}
                onChange={(e) => setAnnouncementItem4(e.target.value)}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
              />
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">CONTATO</h2>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-xs font-medium text-neutral-500">
                WhatsApp (DDI + DDD + número, só dígitos)
                <input
                  required
                  placeholder="5534999998888"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                />
              </label>
              <label className="text-xs font-medium text-neutral-500">
                Mensagem padrão do botão flutuante
                <textarea
                  required
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                />
              </label>
              <label className="text-xs font-medium text-neutral-500">
                E-mail de contato
                <input
                  required
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                />
              </label>
            </div>
          </section>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {saved && !error && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              Configurações salvas com sucesso.
            </p>
          )}

          <button type="submit" disabled={isSaving} className="btn-primary w-full disabled:opacity-60">
            {isSaving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
