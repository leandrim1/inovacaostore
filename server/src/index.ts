import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { productsRouter } from "./routes/products.routes.js";
import { categoriesRouter } from "./routes/categories.routes.js";
import { ordersRouter } from "./routes/orders.routes.js";
import { shippingRouter } from "./routes/shipping.routes.js";
import { couponsRouter } from "./routes/coupons.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { adminProductsRouter } from "./routes/admin/products.routes.js";
import { adminCategoriesRouter } from "./routes/admin/categories.routes.js";
import { adminOrdersRouter } from "./routes/admin/orders.routes.js";
import { adminDashboardRouter } from "./routes/admin/dashboard.routes.js";
import { requireAdmin } from "./middleware/requireAdmin.js";
import { UPLOADS_DIR } from "./upload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/shipping", shippingRouter);
app.use("/api/coupons", couponsRouter);

app.use("/api/admin/auth", authRouter);
app.use("/api/admin/products", requireAdmin, adminProductsRouter);
app.use("/api/admin/categories", requireAdmin, adminCategoriesRouter);
app.use("/api/admin/orders", requireAdmin, adminOrdersRouter);
app.use("/api/admin/dashboard", requireAdmin, adminDashboardRouter);

app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Erro interno do servidor." });
  },
);

const distDir = path.join(__dirname, "..", "..", "dist");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(distDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      next();
      return;
    }
    res.sendFile(path.join(distDir, "index.html"));
  });
}

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
