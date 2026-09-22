import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Crop, Upload, X } from "lucide-react";
import {
  useAdminBanners,
  useAdminGalleryImages,
  useAdminHeroImages,
  useAdminPaymentMethods,
  useAdminSettings,
  useDeleteBanner,
  useDeleteGalleryImage,
  useDeleteHeroImage,
  useDeletePaymentMethod,
  useUpdateBanner,
  useUpdateHeroImageSettings,
  useUpdatePaymentMethod,
  useUpdateSettings,
  useUploadBanners,
  useUploadGalleryImages,
  useUploadHeroImages,
  useUploadPaymentMethods,
  type SiteSettingsInput,
} from "../../hooks/admin/useAdminSettings";
import type { Banner, HeroImage, PaymentMethod } from "../../hooks/useSiteSettings";
import { ImagePositionEditor } from "../../components/admin/ImagePositionEditor";

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useAdminSettings();
  const { data: heroImages = [] } = useAdminHeroImages();
  const { data: galleryImages = [] } = useAdminGalleryImages();
  const updateSettings = useUpdateSettings();
  const uploadHeroImages = useUploadHeroImages();
  const deleteHeroImage = useDeleteHeroImage();
  const updateHeroImageSettings = useUpdateHeroImageSettings();
  const [editingHeroImage, setEditingHeroImage] = useState<HeroImage | null>(null);
  const uploadGalleryImages = useUploadGalleryImages();
  const deleteGalleryImage = useDeleteGalleryImage();
  const { data: banners = [] } = useAdminBanners();
  const uploadBanners = useUploadBanners();
  const deleteBanner = useDeleteBanner();
  const updateBanner = useUpdateBanner();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [editandoBanner, setEditandoBanner] = useState<Banner | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  // Guarda o link enquanto a pessoa digita; só vai para o servidor ao sair do
  // campo, para não disparar uma requisição por tecla.
  const [linksEmEdicao, setLinksEmEdicao] = useState<Record<string, string>>({});
  const { data: formasDePagamento = [] } = useAdminPaymentMethods();
  const uploadFormasDePagamento = useUploadPaymentMethods();
  const deleteFormaDePagamento = useDeletePaymentMethod();
  const updateFormaDePagamento = useUpdatePaymentMethod();
  const pagamentoInputRef = useRef<HTMLInputElement>(null);
  const [pagamentoError, setPagamentoError] = useState<string | null>(null);
  // Mesmo padrão do link do banner: guarda enquanto digita, salva ao sair.
  const [nomesEmEdicao, setNomesEmEdicao] = useState<Record<string, string>>({});
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
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressZip, setAddressZip] = useState("");
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
    setAddressStreet(settings.addressStreet);
    setAddressCity(settings.addressCity);
    setAddressState(settings.addressState);
    setAddressZip(settings.addressZip);
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
      addressStreet,
      addressCity,
      addressState,
      addressZip,
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

  async function handleBannerFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setBannerError(null);
    try {
      await uploadBanners.mutateAsync(Array.from(e.target.files));
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : "Não foi possível enviar as imagens.");
    } finally {
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  }

  async function handleDeleteBanner(id: string) {
    setBannerError(null);
    try {
      await deleteBanner.mutateAsync(id);
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : "Não foi possível excluir a imagem.");
    }
  }

  async function salvarLinkDoBanner(banner: Banner) {
    const novo = linksEmEdicao[banner.id];
    if (novo === undefined || novo === (banner.linkUrl ?? "")) return;
    setBannerError(null);
    try {
      await updateBanner.mutateAsync({ id: banner.id, data: { linkUrl: novo } });
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : "Não foi possível salvar o link.");
    }
  }

  async function handlePagamentoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setPagamentoError(null);
    try {
      await uploadFormasDePagamento.mutateAsync(Array.from(e.target.files));
    } catch (err) {
      setPagamentoError(err instanceof Error ? err.message : "Não foi possível enviar as imagens.");
    } finally {
      if (pagamentoInputRef.current) pagamentoInputRef.current.value = "";
    }
  }

  async function handleDeleteFormaDePagamento(id: string) {
    setPagamentoError(null);
    try {
      await deleteFormaDePagamento.mutateAsync(id);
    } catch (err) {
      setPagamentoError(err instanceof Error ? err.message : "Não foi possível excluir a imagem.");
    }
  }

  async function salvarNomeDaForma(forma: PaymentMethod) {
    const novo = nomesEmEdicao[forma.id];
    if (novo === undefined || novo === forma.label) return;
    setPagamentoError(null);
    try {
      await updateFormaDePagamento.mutateAsync({ id: forma.id, data: { label: novo } });
    } catch (err) {
      setPagamentoError(err instanceof Error ? err.message : "Não foi possível salvar o nome.");
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
                  className="mt-1 w-full admin-input px-3 py-2"
                />
              </label>
              <label className="text-xs font-medium text-neutral-500">
                Título (use uma quebra de linha para dividir em duas linhas)
                <textarea
                  required
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  rows={2}
                  className="mt-1 w-full admin-input px-3 py-2"
                />
              </label>
              <label className="text-xs font-medium text-neutral-500">
                Descrição
                <textarea
                  required
                  value={heroDescription}
                  onChange={(e) => setHeroDescription(e.target.value)}
                  rows={3}
                  className="mt-1 w-full admin-input px-3 py-2"
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-neutral-500">
                  Texto do botão
                  <input
                    required
                    value={heroCtaLabel}
                    onChange={(e) => setHeroCtaLabel(e.target.value)}
                    className="mt-1 w-full admin-input px-3 py-2"
                  />
                </label>
                <label className="text-xs font-medium text-neutral-500">
                  Link do botão (ex: /busca, /destaques ou /categoria/tenis)
                  <input
                    required
                    value={heroCtaUrl}
                    onChange={(e) => setHeroCtaUrl(e.target.value)}
                    className="mt-1 w-full admin-input px-3 py-2"
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
                    <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/50 to-transparent py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setEditingHeroImage(img)}
                        className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-brand-ink hover:bg-white"
                      >
                        <Crop size={11} /> Ajustar
                      </button>
                    </div>
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
              BANNERS (acima das categorias)
            </h2>
            <p className="mb-4 text-xs leading-relaxed text-neutral-400">
              Um espaço só para arte, do mesmo tamanho do banner de promoção. Suba a peça já pronta —
              nada de texto é escrito por cima. Com mais de uma imagem, elas giram em carrossel. Sem
              nenhuma, a faixa some do site.
            </p>
            {bannerError && <p className="mb-3 text-sm text-red-600">{bannerError}</p>}

            {banners.length > 0 && (
              <ul className="mb-4 flex flex-col gap-4">
                {banners.map((banner) => (
                  <li key={banner.id} className="rounded-xl ring-1 ring-black/5">
                    <div className="group relative aspect-[21/9] overflow-hidden rounded-t-xl bg-neutral-100">
                      <img src={banner.url} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/50 to-transparent py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => setEditandoBanner(banner)}
                          className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-brand-ink hover:bg-white"
                        >
                          <Crop size={11} /> Ajustar enquadramento
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(banner.id)}
                        aria-label="Excluir banner"
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <label className="block p-3 text-xs font-medium text-neutral-500">
                      Link ao clicar (opcional)
                      <input
                        type="text"
                        placeholder="/categoria/camisetas ou https://…"
                        value={linksEmEdicao[banner.id] ?? banner.linkUrl ?? ""}
                        onChange={(e) =>
                          setLinksEmEdicao((atual) => ({ ...atual, [banner.id]: e.target.value }))
                        }
                        onBlur={() => salvarLinkDoBanner(banner)}
                        className="mt-1 w-full admin-input px-3 py-2"
                      />
                      <span className="mt-1 block text-[11px] font-normal text-neutral-400">
                        Em branco, a imagem fica só decorativa. O link é salvo ao sair do campo.
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleBannerFileChange}
              className="hidden"
              id="banner-input"
            />
            <label
              htmlFor="banner-input"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-black/20 px-4 py-3 text-sm text-neutral-500 hover:border-brand-ink hover:text-brand-ink"
            >
              <Upload size={16} />
              {uploadBanners.isPending ? "Enviando…" : "Enviar imagens"}
            </label>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-1 font-display text-sm tracking-widest text-neutral-500">
              FORMAS DE PAGAMENTO
            </h2>
            <p className="mb-4 text-xs leading-relaxed text-neutral-400">
              As bandeirinhas que aparecem no rodapé do site. As dez iniciais já vêm prontas —
              para trocar qualquer uma pelo logo oficial, exclua e envie no lugar. Use PNG com fundo
              transparente (JPG e WEBP também servem; SVG não é aceito por segurança). Sem nenhuma
              cadastrada, a fileira some e fica só o selo de compra segura.
            </p>
            {pagamentoError && <p className="mb-3 text-sm text-red-600">{pagamentoError}</p>}

            {formasDePagamento.length > 0 && (
              <ul className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {formasDePagamento.map((forma) => (
                  <li
                    key={forma.id}
                    className="flex items-center gap-3 rounded-xl p-2 ring-1 ring-black/5"
                  >
                    {/* Fundo quadriculado claro: é como o lojista percebe na
                        hora se o PNG veio com fundo branco em vez de
                        transparente. */}
                    <div className="grid h-12 w-[68px] shrink-0 place-items-center rounded-lg bg-[repeating-conic-gradient(#f3f3f3_0%_25%,#ffffff_0%_50%)] bg-[length:12px_12px] p-1.5">
                      <img src={forma.url} alt="" className="h-full w-full object-contain" />
                    </div>
                    <input
                      type="text"
                      placeholder="Nome (ex.: Visa)"
                      value={nomesEmEdicao[forma.id] ?? forma.label}
                      onChange={(e) =>
                        setNomesEmEdicao((atual) => ({ ...atual, [forma.id]: e.target.value }))
                      }
                      onBlur={() => salvarNomeDaForma(forma)}
                      className="admin-input min-w-0 flex-1 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteFormaDePagamento(forma.id)}
                      aria-label={`Excluir ${forma.label || "forma de pagamento"}`}
                      className="shrink-0 rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <input
              ref={pagamentoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePagamentoFileChange}
              className="hidden"
              id="pagamento-input"
            />
            <label
              htmlFor="pagamento-input"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-black/20 px-4 py-3 text-sm text-neutral-500 hover:border-brand-ink hover:text-brand-ink"
            >
              <Upload size={16} />
              {uploadFormasDePagamento.isPending ? "Enviando…" : "Enviar logos"}
            </label>
            <p className="mt-2 text-[11px] text-neutral-400">
              O nome é o que o leitor de tela anuncia e o que aparece ao passar o mouse. Ele é salvo
              ao sair do campo. As que você enviar entram no fim da fileira.
            </p>
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
                className="admin-input px-3 py-2"
              />
              <input
                required
                placeholder="Item 2"
                value={announcementItem2}
                onChange={(e) => setAnnouncementItem2(e.target.value)}
                className="admin-input px-3 py-2"
              />
              <input
                required
                placeholder="Item 3"
                value={announcementItem3}
                onChange={(e) => setAnnouncementItem3(e.target.value)}
                className="admin-input px-3 py-2"
              />
              <input
                required
                placeholder="Item 4"
                value={announcementItem4}
                onChange={(e) => setAnnouncementItem4(e.target.value)}
                className="admin-input px-3 py-2"
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
                  className="mt-1 w-full admin-input px-3 py-2"
                />
              </label>
              <label className="text-xs font-medium text-neutral-500">
                Mensagem padrão do botão flutuante
                <textarea
                  required
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={3}
                  className="mt-1 w-full admin-input px-3 py-2"
                />
              </label>
              <label className="text-xs font-medium text-neutral-500">
                E-mail de contato
                <input
                  required
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="mt-1 w-full admin-input px-3 py-2"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-1 font-display text-sm tracking-widest text-neutral-500">ENDEREÇO DA LOJA</h2>
            <p className="mb-4 text-xs leading-relaxed text-neutral-500">
              Aparece no rodapé, na página “Sobre a loja” e no texto de retirada. Ao clicar, o cliente
              abre este endereço no Google Maps.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-xs font-medium text-neutral-500">
                Rua e número
                <input
                  required
                  placeholder="Rua Ouro Preto, 784"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  className="mt-1 w-full admin-input px-3 py-2"
                />
              </label>
              <label className="text-xs font-medium text-neutral-500">
                Cidade
                <input
                  required
                  placeholder="Patos de Minas"
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  className="mt-1 w-full admin-input px-3 py-2"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-medium text-neutral-500">
                  Estado (sigla)
                  <input
                    required
                    maxLength={2}
                    placeholder="MG"
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value.toUpperCase())}
                    className="mt-1 w-full admin-input px-3 py-2 uppercase"
                  />
                </label>
                <label className="text-xs font-medium text-neutral-500">
                  CEP
                  <input
                    required
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="38700-000"
                    value={addressZip}
                    onChange={(e) => setAddressZip(e.target.value)}
                    className="mt-1 w-full admin-input px-3 py-2"
                  />
                </label>
              </div>
            </div>
            <p className="mt-3 rounded-xl bg-brand-yellow/10 px-3 py-2.5 text-xs leading-relaxed text-neutral-600 ring-1 ring-brand-yellow/30">
              Este endereço é o que o cliente vê. O ponto de partida do{" "}
              <strong className="font-medium text-brand-ink">cálculo de frete</strong> é separado — se a
              loja mudar de lugar, ajuste também em{" "}
              <Link to="/admin/frete" className="font-medium text-brand-ink underline">
                Frete
              </Link>
              .
            </p>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            {error && <p className="alert-error">{error}</p>}
            {saved && !error && <p className="alert-success">Configurações salvas com sucesso.</p>}

            <button type="submit" disabled={isSaving} className="btn-primary w-full disabled:opacity-60">
              {isSaving ? "Salvando…" : "Salvar alterações"}
            </button>
          </section>
        </div>
      </form>

      {editandoBanner && (
        <ImagePositionEditor
          src={editandoBanner.url}
          alt=""
          desktopAspect={21 / 9}
          mobileAspect={9 / 10}
          initialDesktopSettings={editandoBanner.desktopSettings ?? null}
          initialMobileSettings={editandoBanner.mobileSettings ?? null}
          onClose={() => setEditandoBanner(null)}
          onSave={(data) => updateBanner.mutateAsync({ id: editandoBanner.id, data })}
        />
      )}

      {editingHeroImage && (
        <ImagePositionEditor
          src={editingHeroImage.url}
          alt=""
          desktopAspect={16 / 7}
          mobileAspect={9 / 16}
          initialDesktopSettings={editingHeroImage.desktopSettings ?? null}
          initialMobileSettings={editingHeroImage.mobileSettings ?? null}
          onClose={() => setEditingHeroImage(null)}
          onSave={(data) => updateHeroImageSettings.mutateAsync({ id: editingHeroImage.id, data })}
        />
      )}
    </div>
  );
}
