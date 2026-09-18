import { prisma } from "./db.js";
import type { Coupon } from "@prisma/client";

export interface CouponSummary {
  code: string;
  description: string;
  percentOff: number;
}

export type CouponValidationResult =
  | { ok: true; coupon: CouponSummary; record: Coupon }
  | { ok: false; error: string };

const GENERIC_INVALID = "Cupom inválido ou expirado.";

/**
 * Confere se um cupom já carregado do banco pode ser usado agora. Não
 * reserva uso nem incrementa contador — isso só acontece de forma atômica
 * na criação do pedido (ver orders.routes.ts), para não deixar uma janela
 * de corrida entre "validar" e "criar o pedido".
 */
async function checkEligibility(coupon: Coupon | null, customerId?: string): Promise<CouponValidationResult> {
  if (!coupon || !coupon.active) {
    return { ok: false, error: GENERIC_INVALID };
  }

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) return { ok: false, error: GENERIC_INVALID };
  if (coupon.expiresAt && now > coupon.expiresAt) return { ok: false, error: GENERIC_INVALID };

  if (coupon.maxRedemptions != null && coupon.usedCount >= coupon.maxRedemptions) {
    return { ok: false, error: "Este cupom já atingiu o limite de usos." };
  }

  if (customerId && coupon.maxRedemptionsPerCustomer != null) {
    const customerUses = await prisma.order.count({ where: { couponCode: coupon.code, customerId } });
    if (customerUses >= coupon.maxRedemptionsPerCustomer) {
      return { ok: false, error: "Você já utilizou este cupom o máximo de vezes permitido." };
    }
  }

  return {
    ok: true,
    coupon: { code: coupon.code, description: coupon.description, percentOff: coupon.percentOff },
    record: coupon,
  };
}

export async function validateCoupon(rawCode: string, customerId?: string): Promise<CouponValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: GENERIC_INVALID };
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  return checkEligibility(coupon, customerId);
}
