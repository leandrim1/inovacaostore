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
export async function assertImageContent(buffer: Buffer): Promise<string> {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_TYPES[detected.mime]) {
    throw new HttpError(400, "O arquivo enviado não é uma imagem válida. Use JPG, PNG, WEBP ou AVIF.");
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
  const { saveUpload } = await import("./storage.js");
  return saveUpload(buffer, randomUploadName(mime), mime);
}
