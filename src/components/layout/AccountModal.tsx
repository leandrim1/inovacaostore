import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function AccountModal() {
  const { isAccountOpen, closeAccount, customer, login, register, logout } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result =
      mode === "login" ? login(email, password) : register(name, email, password);
    if (!result.ok) {
      setError(result.error ?? "Não foi possível continuar.");
      return;
    }
    resetForm();
  }

  function handleClose() {
    closeAccount();
    resetForm();
  }

  return (
    <AnimatePresence>
      {isAccountOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Conta do cliente"
            className="fixed left-1/2 top-1/2 z-[71] w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fechar"
              className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-neutral-100"
            >
              <X size={18} />
            </button>

            {customer ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-yellow">
                  <User size={28} className="text-brand-ink" />
                </div>
                <div>
                  <p className="font-display text-lg">{customer.name}</p>
                  <p className="text-sm text-neutral-500">{customer.email}</p>
                </div>
                <p className="mt-2 text-sm text-neutral-500">
                  Você ainda não fez nenhum pedido.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    handleClose();
                  }}
                  className="btn-outline mt-2 w-full"
                >
                  Sair da conta
                </button>
              </div>
            ) : (
              <>
                <h2 className="mb-1 font-display text-2xl">
                  {mode === "login" ? "Entrar" : "Criar conta"}
                </h2>
                <p className="mb-5 text-sm text-neutral-500">
                  {mode === "login"
                    ? "Acesse sua conta para acompanhar seus pedidos."
                    : "Crie sua conta para agilizar suas próximas compras."}
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  {mode === "register" && (
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
                      required
                    />
                  )}
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
                    required
                  />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button type="submit" className="btn-primary mt-2 w-full">
                    {mode === "login" ? "Entrar" : "Criar conta"}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setError(null);
                  }}
                  className="mt-4 w-full text-center text-sm text-neutral-500 hover:text-brand-ink"
                >
                  {mode === "login"
                    ? "Não tem conta? Cadastre-se"
                    : "Já tem conta? Entrar"}
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
