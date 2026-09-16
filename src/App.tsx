import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { CartDrawer } from "./components/layout/CartDrawer";
import { AccountModal } from "./components/layout/AccountModal";
import { WhatsAppButton } from "./components/layout/WhatsAppButton";

const Home = lazy(() => import("./pages/Home"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const PolicyPage = lazy(() => import("./pages/PolicyPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="py-32 text-center text-neutral-400">Carregando…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/categoria/:slug" element={<CategoryPage />} />
            <Route path="/busca" element={<SearchPage />} />
            <Route path="/produto/:slug" element={<ProductPage />} />
            <Route path="/carrinho" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/politicas/:slug" element={<PolicyPage />} />
            <Route path="/sobre" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <AccountModal />
      <WhatsAppButton />
    </div>
  );
}
