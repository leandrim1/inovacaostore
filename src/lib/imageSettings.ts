/**
 * Enquadramento de imagem controlado pelo admin: onde a imagem "ancora"
 * dentro do container (positionX/Y, iguais a `object-position` em %), quanto
 * ela é ampliada (zoom, sempre >= 1 para nunca revelar espaço vazio dentro
 * de um container `object-fit: cover`) e sua rotação em graus.
 *
 * `positionX`/`positionY` usam a mesma semântica de `object-position`: o
 * ponto da imagem de origem (em %) que fica alinhado com aquele ponto do
 * container.
 */
export interface ImageSettings {
  positionX: number;
  positionY: number;
  zoom: number;
  rotation: number;
}

export const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  positionX: 50,
  positionY: 50,
  zoom: 1,
  rotation: 0,
};

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;
export const ROTATION_MIN = -45;
export const ROTATION_MAX = 45;

/**
 * Um enquadramento igual ao padrão — centralizado, sem zoom e sem rotação —
 * não recorta nada: é o mesmo que não ter enquadramento nenhum.
 *
 * A distinção importa porque o editor do painel salva SEMPRE os dois
 * breakpoints, preenchendo com o padrão aquele que o lojista nem abriu. Sem
 * esta checagem, mexer só no desktop gravava um "enquadramento" no celular e
 * os banners trocavam a arte inteira por um quadro fixo que corta.
 */
export function isDefaultImageSettings(settings: ImageSettings | null | undefined): boolean {
  if (!settings) return true;
  const s = clampImageSettings(settings);
  const d = DEFAULT_IMAGE_SETTINGS;
  // Tolerância pequena: os controles são contínuos e um 1.0000001 vindo do
  // slider não é uma escolha de recorte.
  const igual = (a: number, b: number) => Math.abs(a - b) < 0.005;
  return (
    igual(s.positionX, d.positionX) &&
    igual(s.positionY, d.positionY) &&
    igual(s.zoom, d.zoom) &&
    igual(s.rotation, d.rotation)
  );
}

/** O enquadramento que de fato muda alguma coisa — `null` quando é o padrão. */
export function effectiveImageSettings(
  settings: ImageSettings | null | undefined,
): ImageSettings | null {
  return isDefaultImageSettings(settings) ? null : (settings ?? null);
}

export function clampImageSettings(settings: Partial<ImageSettings>): ImageSettings {
  return {
    positionX: clamp(settings.positionX ?? DEFAULT_IMAGE_SETTINGS.positionX, 0, 100),
    positionY: clamp(settings.positionY ?? DEFAULT_IMAGE_SETTINGS.positionY, 0, 100),
    zoom: clamp(settings.zoom ?? DEFAULT_IMAGE_SETTINGS.zoom, ZOOM_MIN, ZOOM_MAX),
    rotation: clamp(settings.rotation ?? DEFAULT_IMAGE_SETTINGS.rotation, ROTATION_MIN, ROTATION_MAX),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Fator de escala extra necessário para que, ao rotacionar uma imagem que já
 * preenche 100% do container (`object-fit: cover`), os cantos do container
 * nunca fiquem sem imagem. Calculado como a razão entre a bounding box do
 * retângulo do container rotacionado e o próprio retângulo — sem essa
 * compensação, qualquer rotação diferente de 0° revelaria "gaps" nos cantos.
 */
export function rotationCoverScale(rotationDeg: number, containerAspect: number): number {
  if (!rotationDeg || !Number.isFinite(containerAspect) || containerAspect <= 0) return 1;
  const rad = (Math.abs(rotationDeg) * Math.PI) / 180;
  const w = containerAspect;
  const h = 1;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const rotatedWidth = w * c + h * s;
  const rotatedHeight = w * s + h * c;
  return Math.max(rotatedWidth / w, rotatedHeight / h);
}

export function totalScale(settings: ImageSettings, containerAspect: number): number {
  return settings.zoom * rotationCoverScale(settings.rotation, containerAspect);
}
