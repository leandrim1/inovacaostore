import { useState } from "react";

/** "Leandro Gomes" → "LG" (ou só "L" com `letras={1}`). */
function iniciais(nome: string, letras: 1 | 2 = 2) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0] ?? "";
  const ultima = letras === 2 && partes.length > 1 ? (partes[partes.length - 1][0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  /** Tamanho, cores e fonte das iniciais — cada lugar mantém o visual que já tinha. */
  className?: string;
  letras?: 1 | 2;
}

/**
 * Avatar do cliente: a foto de perfil quando existe, as iniciais quando não.
 *
 * Se a foto não carregar (arquivo removido, sem internet), volta para as
 * iniciais em vez de mostrar o ícone de imagem quebrada. O erro é lembrado
 * por URL: uma foto nova tenta carregar de novo.
 *
 * Decorativo (`aria-hidden`): o nome do cliente sempre aparece em texto ao
 * lado, e ler "foto de Leandro" antes de "Olá, Leandro" seria só ruído.
 */
export function UserAvatar({ name, avatarUrl, className = "", letras = 2 }: UserAvatarProps) {
  const [urlComErro, setUrlComErro] = useState<string | null>(null);
  const mostrarFoto = Boolean(avatarUrl) && urlComErro !== avatarUrl;

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
    >
      {mostrarFoto ? (
        <img
          src={avatarUrl!}
          alt=""
          decoding="async"
          draggable={false}
          onError={() => setUrlComErro(avatarUrl!)}
          className="h-full w-full object-cover"
        />
      ) : (
        iniciais(name, letras)
      )}
    </span>
  );
}
