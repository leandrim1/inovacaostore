import { Router } from "express";
import { prisma } from "../../db.js";

export const adminDashboardRouter = Router();

adminDashboardRouter.get("/", async (_req, res) => {
  const [productCount, activeProductCount, orderCount, pendingOrderCount, categoryCount, lowStockVariants] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "pendente" } }),
      prisma.category.count(),
      prisma.productVariant.count({ where: { stock: { lte: 2, gt: 0 } } }),
    ]);

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });

  res.json({
    productCount,
    activeProductCount,
    orderCount,
    pendingOrderCount,
    categoryCount,
    lowStockVariants,
    recentOrders,
  });
});
