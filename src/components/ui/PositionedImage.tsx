import { useRef, type ImgHTMLAttributes } from "react";
import {
  DEFAULT_IMAGE_SETTINGS,
  effectiveImageSettings,
  totalScale,
  type ImageSettings,
} from "../../lib/imageSettings";
import { useElementAspectRatio } from "../../hooks/useElementAspectRatio";
import { useIsMobileViewport } from "../../hooks/useIsMobileViewport";

interface PositionedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "style"> {
  alt: string;
  desktopSettings?: ImageSettings | null;
  mobileSettings?: ImageSettings | null;
  /**
   * Classes usadas quando a imagem (no breakpoint atual) ainda não tem
   * enquadramento salvo — deve reproduzir exatamente a aparência que o local
   * já tinha antes deste componente existir, para nunca quebrar o design
   * atual de imagens que o admin nunca ajustou.
   */
  fallbackClassName?: string;
  /** Classes do elemento mais externo (ex: "absolute inset-0" quando a imagem é um fundo). */
  wrapperClassName?: string;
}

/**
 * Renderiza uma imagem respeitando o enquadramento (posição/zoom/rotação)
 * salvo pelo admin para o breakpoint atual. É o único lugar que sabe
 * transformar `ImageSettings` em CSS — usado tanto no site público quanto na
 * prévia do editor do admin, para as duas visões nunca poderem divergir.
 */
export function PositionedImage({
  desktopSettings,
  mobileSettings,
  fallbackClassName = "object-cover",
  wrapperClassName = "h-full w-full",
  className = "",
  ...imgProps
}: PositionedImageProps) {
  const scaleRef = useRef<HTMLDivElement>(null);
  const aspect = useElementAspectRatio(scaleRef, 1);
  const isMobile = useIsMobileViewport();

  // Enquadramento salvo igual ao padrão não recorta nada — vale como se não
  // existisse, senão um "Salvar" sem mexer em nada mudaria o layout.
  const settings = effectiveImageSettings(isMobile ? mobileSettings : desktopSettings);

  if (!settings) {
    return <img {...imgProps} className={`${wrapperClassName} ${fallbackClassName} ${className}`} />;
  }

  const scale = totalScale(settings, aspect);
  const merged = { ...DEFAULT_IMAGE_SETTINGS, ...settings };

  return (
    <div
      ref={scaleRef}
      className={wrapperClassName}
      style={{ transform: `scale(${scale}) rotate(${merged.rotation}deg)` }}
    >
      <img
        {...imgProps}
        className={`h-full w-full object-cover ${className}`}
        style={{ objectPosition: `${merged.positionX}% ${merged.positionY}%` }}
      />
    </div>
  );
}
