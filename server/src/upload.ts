import multer from "multer";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HttpError } from "./errors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    // A extensão é derivada do mimetype já validado pelo fileFilter, nunca do
    // nome de arquivo enviado pelo cliente (evita gravar arquivos com
    // extensão arbitrária, ex.: "foto.jpg.html").
    const ext = ALLOWED_TYPES[file.mimetype] ?? ".jpg";
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES[file.mimetype]) {
      cb(new HttpError(400, "Formato de imagem não suportado. Use JPG, PNG, WEBP ou AVIF."));
      return;
    }
    cb(null, true);
  },
});
