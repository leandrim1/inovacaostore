/**
 * Prepara a foto de perfil no próprio aparelho antes de enviar.
 *
 * Foto de celular chega com 3–12 MB. A Vercel recusa requisições acima de
 * 4,5 MB, e mesmo abaixo disso seria um upload lento para virar um círculo de
 * 64px. Aqui a foto é recortada no quadrado central e reduzida para 512px —
 * o arquivo enviado fica em torno de 50–200 KB — e a prévia mostrada ao
 * cliente é exatamente esse resultado: o que ele vê é o que vai ser salvo.
 *
 * O servidor refaz a validação e o recorte por conta própria; isto aqui é
 * para a experiência, não para a segurança.
 */

const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
/** Alguns celulares entregam o arquivo sem tipo; aí vale a extensão. */
const EXTENSOES_ACEITAS = /\.(jpe?g|png|webp)$/i;

/** Tamanho máximo do arquivo ORIGINAL escolhido (antes da redução). */
export const FOTO_MAX_MB = 15;
const LADO_SAIDA = 512;

/** `accept` do seletor de arquivo: no celular, abre galeria e câmera. */
export const ACCEPT_FOTO = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

/** Erro com mensagem pronta para mostrar ao cliente. */
export class FotoInvalida extends Error {}

interface ImagemDecodificada {
  fonte: CanvasImageSource;
  largura: number;
  altura: number;
  liberar: () => void;
}

async function decodificar(arquivo: File): Promise<ImagemDecodificada> {
  if (typeof createImageBitmap === "function") {
    try {
      // `from-image`: aplica a orientação EXIF — foto tirada em pé não deita.
      const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
      return { fonte: bitmap, largura: bitmap.width, altura: bitmap.height, liberar: () => bitmap.close() };
    } catch {
      // Navegador sem suporte a essa opção/formato: tenta pelo <img> abaixo.
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () =>
      resolve({
        fonte: img,
        largura: img.naturalWidth,
        altura: img.naturalHeight,
        liberar: () => URL.revokeObjectURL(url),
      });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new FotoInvalida("Não conseguimos abrir essa imagem. Ela pode estar corrompida — tente outra foto."));
    };
    img.src = url;
  });
}

function paraBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, qualidade));
}

/**
 * Valida o arquivo escolhido e devolve a foto pronta para enviar (quadrada,
 * até 512px, WebP — ou JPEG em navegador que não gera WebP).
 * Lança `FotoInvalida` com a mensagem para o cliente.
 */
export async function prepararFotoDePerfil(arquivo: File): Promise<Blob> {
  const tipoOk = TIPOS_ACEITOS.includes(arquivo.type) || (!arquivo.type && EXTENSOES_ACEITAS.test(arquivo.name));
  if (!tipoOk) {
    throw new FotoInvalida("Formato não suportado. Envie uma foto JPG, PNG ou WebP.");
  }
  if (arquivo.size === 0) {
    throw new FotoInvalida("Esse arquivo está vazio. Escolha outra foto.");
  }
  if (arquivo.size > FOTO_MAX_MB * 1024 * 1024) {
    throw new FotoInvalida(`A foto é muito grande. Escolha uma imagem de até ${FOTO_MAX_MB} MB.`);
  }

  const imagem = await decodificar(arquivo);
  try {
    const lado = Math.min(imagem.largura, imagem.altura);
    if (!lado) throw new FotoInvalida("Não conseguimos abrir essa imagem. Tente outra foto.");

    const saida = Math.min(LADO_SAIDA, lado);
    const canvas = document.createElement("canvas");
    canvas.width = saida;
    canvas.height = saida;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new FotoInvalida("Seu navegador não conseguiu preparar a foto. Tente outro navegador.");
    ctx.imageSmoothingQuality = "high";
    // Quadrado central — o mesmo enquadramento do círculo da conta.
    ctx.drawImage(
      imagem.fonte,
      (imagem.largura - lado) / 2,
      (imagem.altura - lado) / 2,
      lado,
      lado,
      0,
      0,
      saida,
      saida,
    );

    const webp = await paraBlob(canvas, "image/webp", 0.9);
    // Safari antigo ignora o pedido de WebP e devolve PNG (pesado): vai JPEG.
    if (webp && webp.type === "image/webp") return webp;

    // JPEG não tem transparência: PNG transparente ganharia fundo preto.
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, saida, saida);
    const jpeg = await paraBlob(canvas, "image/jpeg", 0.9);
    if (!jpeg) throw new FotoInvalida("Não conseguimos preparar essa foto. Tente outra imagem.");
    return jpeg;
  } finally {
    imagem.liberar();
  }
}
