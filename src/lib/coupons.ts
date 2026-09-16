export interface Coupon {
  code: string;
  description: string;
  percentOff: number;
}

const COUPONS: Coupon[] = [
  { code: "BEMVINDO10", description: "10% de desconto de boas-vindas", percentOff: 10 },
  { code: "INOVA15", description: "15% de desconto especial", percentOff: 15 },
];

export function findCoupon(code: string): Coupon | undefined {
  const normalized = code.trim().toUpperCase();
  return COUPONS.find((c) => c.code === normalized);
}
