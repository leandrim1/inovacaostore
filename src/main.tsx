import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import "./index.css";
import App from "./App.tsx";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { readCachedSiteSettings } from "./hooks/useSiteSettings";

/**
 * Visitante que volta à página inicial: começa a baixar a imagem do hero
 * agora, antes de a página inicial (carregada sob demanda) ser baixada e
 * montada. A imagem vem da última configuração guardada; se o painel tiver
 * mudado, o pior caso é baixar uma imagem a mais.
 */
if (window.location.pathname === "/") {
  const hero = readCachedSiteSettings()?.data.heroImages[0]?.url;
  if (hero) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = hero;
    link.setAttribute("fetchpriority", "high");
    document.head.appendChild(link);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
