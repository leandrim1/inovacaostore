import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export interface FinanceSettings {
  id: string;
  paymentFeePixPct: number;
  paymentFeeCardPct: number;
  paymentFeeBoletoPct: number;
  paymentFeeOtherPct: number;
  platformFeePct: number;
  includeCancelledOrders: boolean;
  includeRefundedOrders: boolean;
  updatedAt: string;
}

export type FinanceSettingsInput = Omit<FinanceSettings, "id" | "updatedAt">;

export const EXPENSE_CATEGORIES = ["embalagem", "marketing", "comissao", "operacional", "outro"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  occurredAt: string;
}

export interface ExpenseInput {
  category: ExpenseCategory;
  description: string;
  amount: number;
  occurredAt: string;
}

function invalidateFinance(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["admin-finance-settings"] });
  qc.invalidateQueries({ queryKey: ["admin-expenses"] });
  qc.invalidateQueries({ queryKey: ["admin-analytics"] });
}

export function useFinanceSettings() {
  return useQuery({
    queryKey: ["admin-finance-settings"],
    queryFn: () => api.get<FinanceSettings>("/api/admin/finance/settings"),
  });
}

export function useUpdateFinanceSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FinanceSettingsInput) => api.put<FinanceSettings>("/api/admin/finance/settings", data),
    onSuccess: () => invalidateFinance(qc),
  });
}

export function useExpenses() {
  return useQuery({
    queryKey: ["admin-expenses"],
    queryFn: () => api.get<{ items: Expense[] }>("/api/admin/finance/expenses").then((r) => r.items),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExpenseInput) => api.post<Expense>("/api/admin/finance/expenses", data),
    onSuccess: () => invalidateFinance(qc),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExpenseInput }) =>
      api.put<Expense>(`/api/admin/finance/expenses/${id}`, data),
    onSuccess: () => invalidateFinance(qc),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/finance/expenses/${id}`),
    onSuccess: () => invalidateFinance(qc),
  });
}
