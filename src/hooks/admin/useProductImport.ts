import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

/**
 * Importação em massa de produtos (Produtos → Importar).
 *
 * Nenhuma validação mora aqui: quem lê a planilha, valida, casa as imagens e
 * grava é o servidor (server/src/imports). Estes hooks só levam e trazem.
 */

/** Campos que a planilha pode ter, na chave que o servidor usa. */
export type CampoImport =
  | "nome" | "descricao" | "categoria" | "subcategoria" | "marca" | "sku"
  | "preco" | "precoPromocional" | "custo" | "estoque" | "tamanho" | "cor"
  | "variacoes" | "peso" | "altura" | "largura" | "comprimento" | "volume"
  | "status" | "destaque" | "tags" | "caracteristicas" | "imagemPrincipal" | "imagens";

export interface ResumoLinha {
  nome: string;
  sku: string;
  categoria: string;
  preco: number;
  precoPromocional: number | null;
  estoque: number;
  variacoes: number;
  imagens: number;
  ativo: boolean;
}

export interface LinhaImport {
  linha: number;
  valores: Partial<Record<CampoImport, string>>;
  erros: string[];
  avisos: string[];
  duplicado: { id: string; name: string } | null;
  categoriaFaltando: string | null;
  resumo: ResumoLinha | null;
}

export interface PreviaImport {
  fileName: string;
  colunasReconhecidas: string[];
  colunasIgnoradas: string[];
  categoriasFaltando: string[];
  categoriasExistentes: { id: string; name: string }[];
  itens: LinhaImport[];
}

export interface ArquivoImagem {
  nome: string;
  url: string;
}

export type TratamentoDuplicado = "ignorar" | "atualizar" | "impedir";

export interface OpcoesImport {
  duplicados: TratamentoDuplicado;
  criarCategorias: boolean;
  /** chave da categoria da planilha → id da categoria escolhida na tela. */
  categoriasEscolhidas: Record<string, string>;
}

export interface ErroImport {
  linha: number;
  produto: string;
  sku: string;
  erro: string;
}

export interface ResultadoLote {
  importId: string;
  status: string;
  lote: { criados: number; atualizados: number; ignorados: number; erros: number };
  acumulado: { total: number; criados: number; atualizados: number; ignorados: number; erros: number };
  errosDoLote: ErroImport[];
}

export interface ImportacaoResumo {
  id: string;
  fileName: string;
  status: string;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  undoneAt: string | null;
  createdAt: string;
  podeDesfazer: boolean;
}

export interface ImportacaoDetalhe extends ImportacaoResumo {
  errors: ErroImport[];
  produtos: { id: string; name: string; sku: string }[];
}

const BASE = "/api/admin/product-imports";

/** Linhas por requisição de gravação — o mesmo limite aceito pelo servidor. */
export const LINHAS_POR_LOTE = 25;
/** Imagens por requisição de upload (a Vercel recusa corpos muito grandes). */
export const IMAGENS_POR_LOTE = 6;

export const URL_MODELO = `${BASE}/template.csv`;
export const urlRelatorioErros = (id: string) => `${BASE}/${id}/errors.csv`;

/** Envia a planilha e recebe a prévia validada (não grava nada). */
export function useEnviarPlanilha() {
  return useMutation({
    mutationFn: (arquivo: File) => {
      const form = new FormData();
      form.append("planilha", arquivo);
      return api.upload<PreviaImport>(`${BASE}/parse`, form);
    },
  });
}

/** Revalida no servidor as linhas corrigidas na tela. */
export function useRevalidarLinhas() {
  return useMutation({
    mutationFn: (itens: { linha: number; valores: Partial<Record<CampoImport, string>> }[]) =>
      api.post<{ itens: LinhaImport[]; categoriasFaltando: string[] }>(`${BASE}/revalidate`, { itens }),
  });
}

export function useEnviarImagens() {
  return useMutation({
    mutationFn: (arquivos: File[]) => {
      const form = new FormData();
      for (const arquivo of arquivos) form.append("imagens", arquivo);
      return api.upload<{ itens: ArquivoImagem[] }>(`${BASE}/images`, form);
    },
  });
}

/** Pergunta ao servidor quais imagens ficam com quais produtos. */
export function useCasarImagens() {
  return useMutation({
    mutationFn: (dados: {
      alvos: { sku: string; nome: string; nomesNaPlanilha: string[] }[];
      arquivos: ArquivoImagem[];
    }) => api.post<{ porSku: Record<string, string[]> }>(`${BASE}/images/match`, dados),
  });
}

export interface LoteParaGravar {
  importId?: string;
  fileName: string;
  itens: { linha: number; valores: Partial<Record<CampoImport, string>> }[];
  imagens: ArquivoImagem[];
  opcoes: OpcoesImport;
  finalizar: boolean;
}

export function useGravarLote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lote: LoteParaGravar) => api.post<ResultadoLote>(`${BASE}/commit`, lote),
    onSuccess: () => {
      // Produtos e categorias mudaram: as telas que os mostram precisam
      // buscar de novo (inclusive a loja e o dashboard).
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
      qc.invalidateQueries({ queryKey: ["product-imports"] });
    },
  });
}

export function useHistoricoImportacoes() {
  return useQuery({
    queryKey: ["product-imports"],
    queryFn: () => api.get<{ itens: ImportacaoResumo[] }>(BASE).then((r) => r.itens),
  });
}

export function useDetalheImportacao(id: string | null) {
  return useQuery({
    queryKey: ["product-imports", id],
    queryFn: () => api.get<ImportacaoDetalhe>(`${BASE}/${id}`),
    enabled: Boolean(id),
  });
}

export function useDesfazerImportacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ removidos: number; comPedido: number }>(`${BASE}/${id}/undo`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      qc.invalidateQueries({ queryKey: ["product-imports"] });
    },
  });
}
