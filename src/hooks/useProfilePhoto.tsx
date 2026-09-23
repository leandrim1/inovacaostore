import { useEffect, useRef, useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { useAuth, type User } from "../context/AuthContext";
import { useBodyScrollLock } from "./useBodyScrollLock";
import { ACCEPT_FOTO, FOTO_MAX_MB, FotoInvalida, prepararFotoDePerfil } from "../lib/avatarImage";
import { UserAvatar } from "../components/account/UserAvatar";
import { ProfilePhotoDialog } from "../components/account/ProfilePhotoDialog";

type Etapa =
  | { tipo: "fechado" }
  | { tipo: "preparando" }
  | { tipo: "previa"; foto: Blob; url: string }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "remover" };

/**
 * Foto de perfil do cliente: seletor de arquivo, prévia antes de salvar,
 * troca e remoção.
 *
 * É um hook (e não um componente fechado) porque o gatilho mora em dois
 * lugares do cabeçalho da conta — o próprio círculo do avatar e os links
 * "Alterar/Remover foto" ao lado do nome —, e o diálogo é um só.
 */
export function useProfilePhoto(user: User | null) {
  const { updateAvatar, removeAvatar } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [etapa, setEtapa] = useState<Etapa>({ tipo: "fechado" });
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // A prévia é um `blob:` na memória do navegador: solta quando sai de cena.
  const previaUrl = etapa.tipo === "previa" ? etapa.url : null;
  useEffect(() => {
    if (!previaUrl) return;
    return () => URL.revokeObjectURL(previaUrl);
  }, [previaUrl]);

  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 4000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const aberto = etapa.tipo !== "fechado";
  useBodyScrollLock(aberto);

  function fechar() {
    if (enviando) return;
    setEtapa({ tipo: "fechado" });
    setErroEnvio(null);
  }

  useEffect(() => {
    if (!aberto || enviando) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setEtapa({ tipo: "fechado" });
      setErroEnvio(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto, enviando]);

  function abrirSeletor() {
    inputRef.current?.click();
  }

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    // Limpa o campo: escolher o MESMO arquivo de novo precisa disparar outra vez.
    e.target.value = "";
    if (!arquivo) return; // cancelou o seletor: o que estava na tela continua

    setErroEnvio(null);
    setEtapa({ tipo: "preparando" });
    try {
      const foto = await prepararFotoDePerfil(arquivo);
      setEtapa({ tipo: "previa", foto, url: URL.createObjectURL(foto) });
    } catch (err) {
      setEtapa({
        tipo: "erro",
        mensagem:
          err instanceof FotoInvalida ? err.message : "Não conseguimos abrir essa imagem. Tente outra foto.",
      });
    }
  }

  async function salvar() {
    if (etapa.tipo !== "previa") return;
    setEnviando(true);
    setErroEnvio(null);
    const resultado = await updateAvatar(etapa.foto);
    setEnviando(false);
    if (!resultado.ok) {
      setErroEnvio(resultado.error);
      return;
    }
    setEtapa({ tipo: "fechado" });
    setAviso("Foto de perfil atualizada.");
  }

  async function confirmarRemocao() {
    setEnviando(true);
    setErroEnvio(null);
    const resultado = await removeAvatar();
    setEnviando(false);
    if (!resultado.ok) {
      setErroEnvio(resultado.error);
      return;
    }
    setEtapa({ tipo: "fechado" });
    setAviso("Foto removida.");
  }

  const elementos = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_FOTO}
        onChange={aoEscolher}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        data-testid="avatar-input"
      />
      <ProfilePhotoDialog aberto={aberto} onFechar={fechar} bloqueado={enviando}>
        {etapa.tipo === "preparando" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="flex h-40 w-40 items-center justify-center rounded-full bg-neutral-100">
              <Loader2 size={28} className="animate-spin text-neutral-400" aria-hidden />
            </span>
            <p className="text-sm text-neutral-500" role="status">
              Preparando a foto…
            </p>
          </div>
        )}

        {etapa.tipo === "previa" && (
          <div className="flex flex-col items-center gap-5 text-center">
            <img
              src={etapa.url}
              alt="Prévia da sua nova foto de perfil"
              className="h-40 w-40 rounded-full object-cover ring-4 ring-brand-yellow ring-offset-4"
            />
            <div className="flex items-center gap-2.5 rounded-full bg-neutral-50 py-1.5 pl-1.5 pr-3.5 text-xs text-neutral-500">
              <img src={etapa.url} alt="" className="h-7 w-7 rounded-full object-cover" />
              Assim ela aparece no menu da loja
            </div>
            {erroEnvio && (
              <p className="alert-error w-full text-left" role="alert">
                {erroEnvio}
              </p>
            )}
            <div className="flex w-full flex-col gap-2.5">
              <button
                type="button"
                onClick={salvar}
                disabled={enviando}
                autoFocus
                className="btn-primary w-full disabled:opacity-60"
              >
                {enviando ? (
                  <>
                    <Loader2 size={15} className="animate-spin" aria-hidden /> Salvando…
                  </>
                ) : (
                  "Salvar foto"
                )}
              </button>
              <button type="button" onClick={abrirSeletor} disabled={enviando} className="btn-outline w-full disabled:opacity-60">
                Escolher outra
              </button>
            </div>
          </div>
        )}

        {etapa.tipo === "erro" && (
          <div className="flex flex-col items-center gap-5 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
              <ImageOff size={26} aria-hidden />
            </span>
            <p className="text-sm leading-relaxed text-brand-ink" role="alert">
              {etapa.mensagem}
            </p>
            <div className="flex w-full flex-col gap-2.5">
              <button type="button" onClick={abrirSeletor} autoFocus className="btn-primary w-full">
                Escolher outra foto
              </button>
              <button type="button" onClick={fechar} className="text-sm text-neutral-500 hover:text-brand-ink">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {etapa.tipo === "remover" && user && (
          <div className="flex flex-col items-center gap-5 text-center">
            <UserAvatar
              name={user.name}
              avatarUrl={user.avatarUrl}
              className="h-28 w-28 bg-brand-yellow font-display text-3xl text-brand-ink"
            />
            <div>
              <p className="font-display text-xl tracking-wide text-brand-ink">Remover sua foto?</p>
              <p className="mt-1 text-sm text-neutral-500">No lugar dela voltam a aparecer suas iniciais.</p>
            </div>
            {erroEnvio && (
              <p className="alert-error w-full text-left" role="alert">
                {erroEnvio}
              </p>
            )}
            <div className="flex w-full flex-col gap-2.5">
              <button
                type="button"
                onClick={confirmarRemocao}
                disabled={enviando}
                autoFocus
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-7 py-3.5 font-display text-sm tracking-[0.15em] text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {enviando ? (
                  <>
                    <Loader2 size={15} className="animate-spin" aria-hidden /> Removendo…
                  </>
                ) : (
                  "Remover foto"
                )}
              </button>
              <button type="button" onClick={fechar} disabled={enviando} className="text-sm text-neutral-500 hover:text-brand-ink">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {(etapa.tipo === "previa" || etapa.tipo === "erro") && (
          <p className="mt-4 text-center text-xs text-neutral-400">JPG, PNG ou WebP, até {FOTO_MAX_MB} MB.</p>
        )}
      </ProfilePhotoDialog>
    </>
  );

  return {
    abrirSeletor,
    pedirRemocao: () => {
      setErroEnvio(null);
      setEtapa({ tipo: "remover" });
    },
    /** Mensagem curta de sucesso ("Foto de perfil atualizada."), some sozinha. */
    aviso,
    /** Campo de arquivo escondido + diálogo: renderizar uma vez na página. */
    elementos,
  };
}
