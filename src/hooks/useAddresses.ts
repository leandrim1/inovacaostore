import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface CustomerAddress {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
  createdAt: string;
}

export type AddressInput = Omit<CustomerAddress, "id" | "createdAt">;

const KEY = ["account-addresses"];

export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<{ items: CustomerAddress[] }>("/api/account/addresses").then((r) => r.items),
    enabled,
  });
}

/** Toda mutação invalida a mesma chave: a lista é a única fonte de verdade na tela. */
function useAddressMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreateAddress() {
  return useAddressMutation((data: Partial<AddressInput>) =>
    api.post<{ address: CustomerAddress }>("/api/account/addresses", data),
  );
}

export function useUpdateAddress() {
  return useAddressMutation(({ id, ...data }: Partial<AddressInput> & { id: string }) =>
    api.patch<{ address: CustomerAddress }>(`/api/account/addresses/${id}`, data),
  );
}

export function useSetDefaultAddress() {
  return useAddressMutation((id: string) => api.post(`/api/account/addresses/${id}/padrao`));
}

export function useDeleteAddress() {
  return useAddressMutation((id: string) => api.delete(`/api/account/addresses/${id}`));
}
