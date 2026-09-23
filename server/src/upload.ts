import multer from "multer";
import crypto from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { HttpError } from "./errors.js";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

export function extensionFor(mimetype: string) {
  return ALLOWED_TYPES[mimetype] ?? ".jpg";
}

/**
 * Nome gerado inteiramente pelo servidor. O nome original enviado pelo
 * cliente é descartado — é por onde entrariam `../../` (path traversal) ou
 * uma extensão dupla tipo `foto.png.html`.
 */
export function randomUploadName(mimetype: string) {
  return `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extensionFor(mimetype)}`;
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 8, fields: 20, parts: 30 },
  fileFilter: (_req, file, cb) => {
    // Primeira barreira, barata: o tipo declarado. Não é confiável sozinho —
    // quem envia escolhe esse valor —, por isso existe assertImageContent.
    if (!ALLOWED_TYPES[file.mimetype]) {
      cb(new HttpError(400, "Formato de imagem não suportado. Use JPG, PNG, WEBP ou AVIF."));
      return;
    }
    cb(null, true);
  },
});

/**
 * Segunda barreira: lê os bytes iniciais do arquivo e confere se ele É mesmo
 * a imagem que diz ser.
 *
 * Sem isto, bastava enviar um HTML com `Content-Type: image/png` no
 * formulário: o arquivo era aceito, gravado e servido pelo site. Também
 * bloqueia SVG (que é XML e pode conter script), já que SVG nunca está na
 * lista de tipos permitidos.
 *
 * Devolve o tipo REAL detectado, que passa a ser a fonte do nome e do
 * content-type gravados — nunca o que o cliente declarou.
 */
export async function assertImageContent(
  buffer: Buffer,
  permitidos: Record<string, string> = ALLOWED_TYPES,
  mensagem = "O arquivo enviado não é uma imagem válida. Use JPG, PNG, WEBP ou AVIF.",
): Promise<string> {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !permitidos[detected.mime]) {
    throw new HttpError(400, mensagem);
  }
  return detected.mime;
}

/**
 * Caminho único para gravar uma imagem enviada por upload: valida o conteúdo
 * real e só então salva, usando o tipo DETECTADO (não o declarado) para o
 * nome do arquivo e para o content-type armazenado.
 */
export async function saveValidatedImage(buffer: Buffer): Promise<string> {
  const mime = await assertImageContent(buffer);
  const otimizada = await optimizeImage(buffer, mime);
  const { saveUpload } = await import("./storage.js");
  return saveUpload(otimizada.buffer, randomUploadName(otimizada.mime), otimizada.mime);
}

/** Maior lado depois de otimizar. Cobre tela 4K no hero sem desperdício. */
const MAX_DIMENSION = 2400;
/** Abaixo disto (e dentro do tamanho máximo) a imagem já está leve: fica como veio. */
const JA_LEVE_BYTES = 300 * 1024;

/**
 * Deixa a imagem enviada pelo painel no tamanho de que o site precisa.
 *
 * Foto de celular chega com 3-8 MB e 4000px. Antes ela era guardada e servida
 * assim: o visitante baixava megabytes, e o celular ainda gastava segundos
 * decodificando 12 milhões de pixels para mostrar numa tela de 400px. Medido:
 * 3 segundos só entre a imagem entrar na página e aparecer.
 *
 * - Redimensiona para caber em 2400px (nunca amplia).
 * - Converte para WebP, que mantém transparência (logos de bandeira).
 * - `rotate()` aplica a orientação EXIF antes de descartá-la: sem isso, foto
 *   de celular tirada em pé apareceria deitada.
 * - Nunca piora: se o resultado sair maior que o original, fica o original.
 * - Se o sharp falhar (arquivo estranho mas já validado pelo conteúdo), o
 *   upload segue com o original em vez de dar erro para o lojista.
 */
export async function optimizeImage(buffer: Buffer, mime: string): Promise<{ buffer: Buffer; mime: string }> {
  try {
    const { default: sharp } = await import("sharp");
    const meta = await sharp(buffer).metadata();
    const dentroDoTamanho = (meta.width ?? 0) <= MAX_DIMENSION && (meta.height ?? 0) <= MAX_DIMENSION;
    // Orientação diferente de 1 precisa ser aplicada mesmo em arquivo leve:
    // alguns navegadores antigos ignoram o EXIF e mostrariam a foto deitada.
    const orientacaoNormal = !meta.orientation || meta.orientation === 1;
    if (buffer.length <= JA_LEVE_BYTES && dentroDoTamanho && orientacaoNormal) {
      return { buffer, mime };
    }

    const saida = await sharp(buffer)
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    if (saida.length >= buffer.length && orientacaoNormal) return { buffer, mime };
    return { buffer: saida, mime: "image/webp" };
  } catch (err) {
    console.error("[upload] otimização falhou, salvando o original:", err instanceof Error ? err.message : err);
    return { buffer, mime };
  }
}

// ---------------------------------------------------------------------------
// Foto de perfil do cliente
// ---------------------------------------------------------------------------

/** Formatos aceitos para a foto de perfil (sem AVIF: nem todo celular abre). */
const AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/**
 * Teto do arquivo recebido. A tela já reduz a foto para 512px antes de
 * enviar (fica em torno de 50–200 KB); este limite é para quem chama a API
 * direto. Fica abaixo dos 4,5 MB que a Vercel aceita por requisição — acima
 * disso a própria Vercel recusaria, com um erro que não é o nosso.
 */
export const AVATAR_MAX_BYTES = 4 * 1024 * 1024;
/** Lado da foto gravada: quadrada, nítida até no círculo grande da conta em tela retina. */
const AVATAR_SIZE = 512;
const AVATAR_TIPO_INVALIDO = "Formato não suportado. Envie uma foto JPG, PNG ou WebP.";

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_BYTES, files: 1, fields: 2, parts: 3 },
  fileFilter: (_req, file, cb) => {
    if (!AVATAR_TYPES[file.mimetype]) {
      cb(new HttpError(400, AVATAR_TIPO_INVALIDO));
      return;
    }
    cb(null, true);
  },
});

/**
 * Grava a foto de perfil: confere o conteúdo real (não o tipo declarado),
 * recorta no quadrado central, reduz para 512px e converte para WebP. Tudo
 * no servidor, mesmo que a tela já tenha feito o mesmo — o que chega aqui
 * nunca é confiável só por ter vindo do nosso site.
 */
export async function saveAvatarImage(buffer: Buffer): Promise<string> {
  const mime = await assertImageContent(buffer, AVATAR_TYPES, AVATAR_TIPO_INVALIDO);
  let saida = { buffer, mime };
  try {
    const { default: sharp } = await import("sharp");
    saida = {
      buffer: await sharp(buffer)
        .rotate()
        .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "centre" })
        .webp({ quality: 85, effort: 4 })
        .toBuffer(),
      mime: "image/webp",
    };
  } catch (err) {
    // Já validado pelo conteúdo: se só o sharp falhou, grava o original em
    // vez de impedir o cliente de ter foto.
    console.error("[avatar] otimização falhou, salvando o original:", err instanceof Error ? err.message : err);
  }
  const { saveUpload } = await import("./storage.js");
  return saveUpload(saida.buffer, `avatar-${randomUploadName(saida.mime)}`, saida.mime);
}

/**
 * Só apaga do storage o que foi gravado como foto de perfil. Proteção extra
 * para que um valor inesperado no banco nunca leve a apagar imagem de
 * produto ou do hero.
 */
export function isAvatarUpload(url: string) {
  const nome = url.split("?")[0].split("/").pop() ?? "";
  return nome.startsWith("avatar-");
}
