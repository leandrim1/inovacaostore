import { useRef, type ImgHTMLAttributes } from "react";
import { DEFAULT_IMAGE_SETTINGS, totalScale, type ImageSettings } from "../../lib/imageSettings";
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
  /**
   * Mostra a imagem INTEIRA, sem cortar, e preenche as sobras com a própria
   * arte desfocada. É o que garante que o que o lojista subiu apareça igual no
   * celular e no computador. Só vale quando não há enquadramento salvo: se ele
   * recortou de propósito, o recorte é respeitado.
   */
  uncropped?: boolean;
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
  uncropped = false,
  className = "",
  ...imgProps
}: PositionedImageProps) {
  const scaleRef = useRef<HTMLDivElement>(null);
  const aspect = useElementAspectRatio(scaleRef, 1);
  const isMobile = useIsMobileViewport();

  const settings = isMobile ? mobileSettings : desktopSettings;

  if (!settings) {
    if (!uncropped) {
      return <img {...imgProps} className={`${wrapperClassName} ${fallbackClassName} ${className}`} />;
    }

    // A arte quase nunca tem a proporção exata da caixa. Cortar destruiria a
    // peça; tarja preta pareceria defeito. A própria imagem desfocada preenche
    // a sobra e o bloco continua parecendo intencional.
    return (
      <span className={`relative block overflow-hidden ${wrapperClassName}`}>
        <span
          aria-hidden
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-2xl"
          style={{ backgroundImage: `url(${imgProps.src})` }}
        />
        <img {...imgProps} className={`relative ${fallbackClassName} ${className}`} />
      </span>
    );
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
