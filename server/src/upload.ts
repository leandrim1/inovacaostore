import multer from "multer";
import crypto from "node:crypto";
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

export function randomUploadName(mimetype: string) {
  return `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extensionFor(mimetype)}`;
}

// Guarda o arquivo em memória em vez de gravar direto no disco: o disco de
// funções serverless (Vercel) é efêmero, então o upload real (para o disco
// local em dev, ou para o Vercel Blob em produção) acontece depois, na rota,
// através de server/src/storage.ts.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES[file.mimetype]) {
      cb(new HttpError(400, "Formato de imagem não suportado. Use JPG, PNG, WEBP ou AVIF."));
      return;
    }
    cb(null, true);
  },
});
