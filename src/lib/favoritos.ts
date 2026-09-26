import { useCallback, useSyncExternalStore } from "react";

/**
 * Favoritos guardados no próprio aparelho (como o carrinho): uma lista de ids
 * de produto. Os dados do produto sempre vêm da API na hora de mostrar — aqui
 * não se guarda nome, preço nem foto, então nada fica desatualizado.
 *
 * Sincroniza entre abas pelo evento `storage`.
 */
const CHAVE = "inovacao:favoritos:v1";
const MAXIMO = 60;
const ID_VALIDO = /^[A-Za-z0-9_-]{6,40}$/;

function ler(): string[] {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
    return Array.isArray(bruto) ? bruto.filter((id): id is string => typeof id === "string" && ID_VALIDO.test(id)).slice(0, MAXIMO) : [];
  } catch {
    return [];
  }
}

let lista: string[] = typeof window === "undefined" ? [] : ler();
const ouvintes = new Set<() => void>();

function gravar(nova: string[]) {
  lista = nova;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(nova));
  } catch {
    // modo privado sem armazenamento: vale só enquanto a página estiver aberta
  }
  ouvintes.forEach((o) => o());
}

function inscrever(o: () => void) {
  ouvintes.add(o);
  const deOutraAba = (e: StorageEvent) => {
    if (e.key !== CHAVE) return;
    lista = ler();
    o();
  };
  window.addEventListener("storage", deOutraAba);
  return () => {
    ouvintes.delete(o);
    window.removeEventListener("storage", deOutraAba);
  };
}

const VAZIA: string[] = [];

export function useFavoritos() {
  const ids = useSyncExternalStore(inscrever, () => lista, () => VAZIA);

  const alternar = useCallback((id: string) => {
    if (!ID_VALIDO.test(id)) return false;
    const tinha = lista.includes(id);
    gravar(tinha ? lista.filter((i) => i !== id) : [id, ...lista].slice(0, MAXIMO));
    return !tinha;
  }, []);

  /** Tira da lista produtos que deixaram de existir ou foram desativados. */
  const manterSomente = useCallback((existentes: string[]) => {
    const validos = lista.filter((id) => existentes.includes(id));
    if (validos.length !== lista.length) gravar(validos);
  }, []);

  return { ids, quantidade: ids.length, tem: (id: string) => ids.includes(id), alternar, manterSomente };
}
