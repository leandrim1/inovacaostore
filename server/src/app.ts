import "dotenv/config";
import "express-async-errors";
import express from "express";
import { MulterError } from "multer";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { productsRouter } from "./routes/products.routes.js";
import { categoriesRouter } from "./routes/categories.routes.js";
import { ordersRouter } from "./routes/orders.routes.js";
import { shippingRouter } from "./routes/shipping.routes.js";
import { couponsRouter } from "./routes/coupons.routes.js";
import { promotionsRouter } from "./routes/promotions.routes.js";
import { pricingRouter } from "./routes/pricing.routes.js";
import { testimonialsRouter } from "./routes/testimonials.routes.js";
import { settingsRouter } from "./routes/settings.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { accountRouter } from "./routes/account.routes.js";
import { adminProductsRouter } from "./routes/admin/products.routes.js";
import { adminCategoriesRouter } from "./routes/admin/categories.routes.js";
import { adminOrdersRouter } from "./routes/admin/orders.routes.js";
import { adminCustomersRouter } from "./routes/admin/customers.routes.js";
import { adminPromotionsRouter } from "./routes/admin/promotions.routes.js";
import { adminCouponsRouter } from "./routes/admin/coupons.routes.js";
import { adminTestimonialsRouter } from "./routes/admin/testimonials.routes.js";
import { adminSettingsRouter } from "./routes/admin/settings.routes.js";
import { adminShippingRouter } from "./routes/admin/shipping.routes.js";
import { adminAnalyticsRouter } from "./routes/admin/analytics.routes.js";
import { adminFinanceRouter } from "./routes/admin/finance.routes.js";
import { requireAdmin } from "./middleware/requireAdmin.js";
import { auditAdminMutations } from "./auditLog.js";
import { UPLOADS_DIR } from "./storage.js";
import { HttpError } from "./errors.js";
import {
  adminApiLimiter,
  blockForgedOrigin,
  globalApiLimiter,
  securityHeaders,
  uploadHeaders,
} from "./security.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

// Atrás do proxy da Vercel, o IP real do cliente vem no X-Forwarded-For.
// Sem isto, todo rate limit contaria o IP do proxy — ou seja, um balde só
// para o mundo inteiro.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(securityHeaders);
// Limite explícito de corpo: sem isto o padrão silencioso do Express (100kb)
// vale para JSON, mas deixamos o número visível e aplicamos também a formulários.
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());

// Arquivos enviados por upload são servidos inertes: nada de sniffing de tipo
// e CSP que proíbe qualquer execução, caso um arquivo malicioso escape das
// validações de conteúdo.
app.use("/uploads", uploadHeaders, express.static(UPLOADS_DIR, { dotfiles: "deny", index: false }));

app.use("/api", globalApiLimiter);
app.use("/api", blockForgedOrigin);

app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/shipping", shippingRouter);
app.use("/api/coupons", couponsRouter);
app.use("/api/promotions", promotionsRouter);
app.use("/api/pricing", pricingRouter);
app.use("/api/testimonials", testimonialsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/account", accountRouter);

app.use("/api/admin", adminApiLimiter);
app.use("/api/admin/auth", authRouter);
app.use("/api/admin", auditAdminMutations);
app.use("/api/admin/products", requireAdmin, adminProductsRouter);
app.use("/api/admin/categories", requireAdmin, adminCategoriesRouter);
app.use("/api/admin/orders", requireAdmin, adminOrdersRouter);
app.use("/api/admin/customers", requireAdmin, adminCustomersRouter);
app.use("/api/admin/promotions", requireAdmin, adminPromotionsRouter);
app.use("/api/admin/coupons", requireAdmin, adminCouponsRouter);
app.use("/api/admin/testimonials", requireAdmin, adminTestimonialsRouter);
app.use("/api/admin/settings", requireAdmin, adminSettingsRouter);
app.use("/api/admin/shipping", requireAdmin, adminShippingRouter);
app.use("/api/admin/analytics", requireAdmin, adminAnalyticsRouter);
app.use("/api/admin/finance", requireAdmin, adminFinanceRouter);

app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    if (err instanceof MulterError) {
      const messages: Record<string, string> = {
        LIMIT_FILE_SIZE: "Cada imagem deve ter no máximo 6MB.",
        LIMIT_FILE_COUNT: "Envie no máximo 8 imagens por vez.",
        LIMIT_UNEXPECTED_FILE: "Campo de upload inesperado.",
      };
      res.status(400).json({ error: messages[err.code] ?? "Não foi possível enviar o arquivo." });
      return;
    }
    // Erros "esperados" e seguros de expor (ex.: JSON malformado no corpo da
    // requisição, limites do multer) chegam com um `status`/`statusCode` 4xx
    // já atribuído pelo próprio middleware que os gerou.
    if (err && typeof err === "object") {
      const status = (err as { status?: unknown; statusCode?: unknown }).status ??
        (err as { statusCode?: unknown }).statusCode;
      if (typeof status === "number" && status >= 400 && status < 500) {
        // Mensagem fixa: a original pode conter caminho de arquivo, trecho do
        // corpo da requisição ou detalhe interno do parser.
        res.status(status).json({ error: "Requisição inválida." });
        return;
      }
    }
    // O detalhe técnico fica só no log do servidor; o cliente recebe algo genérico.
    console.error(err);
    res.status(500).json({ error: "Erro interno do servidor." });
  },
);

// Só usado quando o backend roda como processo único servindo tudo (ex.: uma
// VPS ou serviço tipo Railway/Render, fora da Vercel). Na Vercel o frontend é
// servido pela própria hospedagem estática e essa rota nunca é alcançada.
const distDir = path.join(__dirname, "..", "..", "dist");
if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
  app.use(express.static(distDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      next();
      return;
    }
    res.sendFile(path.join(distDir, "index.html"));
  });
}
