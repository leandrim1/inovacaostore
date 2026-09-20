import type { Request, Response, NextFunction } from "express";
import { prisma } from "./db.js";

/** Campos que jamais podem entrar no log, mesmo por acidente. */
const CAMPOS_PROIBIDOS = new Set([
  "password",
  "currentpassword",
  "newpassword",
  "passwordhash",
  "token",
  "code",
  "secret",
  "authorization",
  "cookie",
]);

/**
 * Resumo legível do que foi enviado, sem nunca copiar segredos nem textos
 * longos. Serve para responder "o que mudou?" numa auditoria, não para
 * reconstruir o payload.
 */
function resumirCorpo(body: unknown): string {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "";
  const partes: string[] = [];
  for (const [chave, valor] of Object.entries(body as Record<string, unknown>)) {
    if (CAMPOS_PROIBIDOS.has(chave.toLowerCase())) continue;
    if (valor === null || ["string", "number", "boolean"].includes(typeof valor)) {
      partes.push(`${chave}=${String(valor).slice(0, 60)}`);
    } else {
      partes.push(`${chave}=[${Array.isArray(valor) ? `${valor.length} itens` : "objeto"}]`);
    }
    if (partes.length >= 12) break;
  }
  return partes.join(" ").slice(0, 500);
}

const ACOES: Record<string, string> = { POST: "criar", PUT: "atualizar", PATCH: "atualizar", DELETE: "excluir" };

/** Grava uma linha de auditoria sem deixar o erro derrubar a operação real. */
export async function registrarAuditoria(entrada: {
  adminId: string | null;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  detail?: string;
  ip?: string;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: entrada.adminId,
        adminEmail: entrada.adminEmail,
        action: entrada.action,
        resource: entrada.resource,
        resourceId: entrada.resourceId ?? null,
        detail: entrada.detail ?? "",
        ip: entrada.ip ?? "",
      },
    });
  } catch (err) {
    console.error("Falha ao gravar log de auditoria:", err);
  }
}

/**
 * Registra automaticamente toda ação administrativa que MUDA estado
 * (POST/PUT/PATCH/DELETE) e deu certo.
 *
 * Fica como middleware em `/api/admin` em vez de espalhado pelas rotas: assim
 * nenhuma rota nova nasce sem auditoria por esquecimento.
 */
export function auditAdminMutations(req: Request, res: Response, next: NextFunction) {
  const action = ACOES[req.method];
  if (!action) {
    next();
    return;
  }

  const detail = resumirCorpo(req.body);
  // Capturado agora: `req.baseUrl`/`req.params` são reescritos pelos routers
  // aninhados e não valem mais nada no momento do evento 'finish'.
  const caminho = req.originalUrl.split("?")[0].replace(/^\/api\/admin\/?/, "");
  const partes = caminho.split("/").filter(Boolean);

  res.on("finish", () => {
    // Só registra o que de fato aconteceu: falhas de validação e 401/403 não
    // sujam a trilha (o rate limit e os logs do servidor cobrem esses casos).
    if (res.statusCode >= 400) return;
    const admin = req.admin;
    if (!admin) return;

    void registrarAuditoria({
      adminId: admin.sub,
      adminEmail: admin.email,
      action,
      resource: partes[0] ?? "admin",
      resourceId: partes[1] ?? null,
      detail,
      ip: req.ip ?? "",
    });
  });

  next();
}
