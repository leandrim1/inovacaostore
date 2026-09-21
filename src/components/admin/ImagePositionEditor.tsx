import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, Maximize2, RotateCw, X } from "lucide-react";
import { PositionedImage } from "../ui/PositionedImage";
import {
  DEFAULT_IMAGE_SETTINGS,
  ROTATION_MAX,
  ROTATION_MIN,
  ZOOM_MAX,
  ZOOM_MIN,
  clampImageSettings,
  effectiveImageSettings,
  type ImageSettings,
} from "../../lib/imageSettings";

type Breakpoint = "desktop" | "mobile";

interface ImagePositionEditorProps {
  src: string;
  alt: string;
  /** Proporção (largura/altura) real do local no site, para a prévia ser fiel. */
  desktopAspect: number;
  mobileAspect: number;
  initialDesktopSettings: ImageSettings | null;
  initialMobileSettings: ImageSettings | null;
  onClose: () => void;
  onSave: (settings: {
    desktopSettings: ImageSettings | null;
    mobileSettings: ImageSettings | null;
  }) => Promise<unknown> | void;
}

export function ImagePositionEditor({
  src,
  alt,
  desktopAspect,
  mobileAspect,
  initialDesktopSettings,
  initialMobileSettings,
  onClose,
  onSave,
}: ImagePositionEditorProps) {
  const [tab, setTab] = useState<Breakpoint>("desktop");
  const [desktopSettings, setDesktopSettings] = useState(initialDesktopSettings ?? DEFAULT_IMAGE_SETTINGS);
  const [mobileSettings, setMobileSettings] = useState(initialMobileSettings ?? DEFAULT_IMAGE_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const dragState = useRef<{ x: number; y: number; positionX: number; positionY: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const settings = tab === "desktop" ? desktopSettings : mobileSettings;
  const setSettings = tab === "desktop" ? setDesktopSettings : setMobileSettings;
  const aspect = tab === "desktop" ? desktopAspect : mobileAspect;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function updateSettings(patch: Partial<ImageSettings>) {
    setSettings((prev) => clampImageSettings({ ...prev, ...patch }));
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { x: e.clientX, y: e.clientY, positionX: settings.positionX, positionY: settings.positionY };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const dx = e.clientX - dragState.current.x;
    const dy = e.clientY - dragState.current.y;
    const deltaPercentX = (dx / rect.width) * 100;
    const deltaPercentY = (dy / rect.height) * 100;
    updateSettings({
      positionX: dragState.current.positionX - deltaPercentX,
      positionY: dragState.current.positionY - deltaPercentY,
    });
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    dragState.current = null;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 5 : 1;
    if (e.key === "ArrowLeft") { updateSettings({ positionX: settings.positionX - step }); e.preventDefault(); }
    if (e.key === "ArrowRight") { updateSettings({ positionX: settings.positionX + step }); e.preventDefault(); }
    if (e.key === "ArrowUp") { updateSettings({ positionY: settings.positionY - step }); e.preventDefault(); }
    if (e.key === "ArrowDown") { updateSettings({ positionY: settings.positionY + step }); e.preventDefault(); }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      // Salva `null` no breakpoint que ficou no padrão, em vez de gravar um
      // enquadramento que não recorta nada. Sem isso, ajustar só o desktop
      // marcava o celular como "recortado" e trocava a arte inteira do banner
      // por um quadro fixo — e o "Resetar" nunca conseguia desfazer.
      await onSave({
        desktopSettings: effectiveImageSettings(desktopSettings),
        mobileSettings: effectiveImageSettings(mobileSettings),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-ink/60 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Ajustar enquadramento da imagem"
          className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
            <h2 className="font-display text-sm tracking-widest text-neutral-500">AJUSTAR ENQUADRAMENTO</h2>
            <button type="button" onClick={onClose} className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-ink">
              <X size={18} />
            </button>
          </div>

          <div className="flex gap-1 border-b border-black/5 px-5 pt-3">
            {(["desktop", "mobile"] as const).map((bp) => (
              <button
                key={bp}
                type="button"
                onClick={() => setTab(bp)}
                className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === bp ? "bg-brand-cream text-brand-ink" : "text-neutral-400 hover:text-brand-ink"
                }`}
              >
                {bp === "desktop" ? "Editar versão Desktop" : "Editar versão Mobile"}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5">
            <p className="text-xs text-neutral-400">
              Arraste a imagem para posicionar, use o zoom para ampliar e a rotação para corrigir o nivelamento.
              A prévia mostra exatamente como a imagem vai aparecer neste local do site.
            </p>

            <div
              ref={previewRef}
              tabIndex={0}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onKeyDown={handleKeyDown}
              className="relative mx-auto w-full max-w-sm cursor-grab touch-none select-none overflow-hidden rounded-xl bg-neutral-100 outline-none ring-brand-yellow focus-visible:ring-2 active:cursor-grabbing"
              style={{ aspectRatio: aspect }}
            >
              <PositionedImage
                key={tab}
                src={src}
                alt={alt}
                desktopSettings={settings}
                mobileSettings={settings}
                className="pointer-events-none h-full w-full"
              />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10" />
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <Maximize2 size={13} /> Zoom
                </span>
                <input
                  type="range"
                  min={ZOOM_MIN}
                  max={ZOOM_MAX}
                  step={0.01}
                  value={settings.zoom}
                  onChange={(e) => updateSettings({ zoom: Number(e.target.value) })}
                  className="accent-brand-ink"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <RotateCw size={13} /> Rotação
                </span>
                <input
                  type="range"
                  min={ROTATION_MIN}
                  max={ROTATION_MAX}
                  step={0.5}
                  value={settings.rotation}
                  onChange={(e) => updateSettings({ rotation: Number(e.target.value) })}
                  className="accent-brand-ink"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ positionX: 50, positionY: 50 })}
                className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-neutral-600 hover:border-brand-ink hover:text-brand-ink"
              >
                <Crosshair size={13} /> Centralizar
              </button>
              <button
                type="button"
                onClick={() => setSettings(DEFAULT_IMAGE_SETTINGS)}
                className="rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-neutral-600 hover:border-brand-ink hover:text-brand-ink"
                title="Volta esta versão ao padrão: ao salvar, a imagem deixa de ser recortada aqui."
              >
                Resetar
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-black/5 px-5 py-4">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancelar
            </button>
            <button type="button" onClick={handleSave} disabled={isSaving} className="btn-primary disabled:opacity-60">
              {isSaving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
