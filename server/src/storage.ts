import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { put, del } from "@vercel/blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// Em produção na Vercel o disco é efêmero, então as imagens vão para o Vercel
// Blob (ativado sozinho quando a env var existir — criada automaticamente ao
// ligar um Blob store ao projeto). Em desenvolvimento local, sem essa env
// var, continuamos salvando em `uploads/` como antes.
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function saveUpload(buffer: Buffer, filename: string, contentType: string): Promise<string> {
  if (useBlob) {
    const blob = await put(filename, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return blob.url;
  }

  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  await fsp.writeFile(path.join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

export async function deleteUpload(url: string): Promise<void> {
  if (/^https?:\/\//.test(url)) {
    await del(url).catch(() => {});
    return;
  }
  const filePath = path.join(UPLOADS_DIR, path.basename(url));
  await fsp.unlink(filePath).catch(() => {});
}
