import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { CartDrawer } from "./components/layout/CartDrawer";
import { AccountModal } from "./components/layout/AccountModal";
import { WhatsAppButton } from "./components/layout/WhatsAppButton";
import { AdminAuthProvider } from "./context/AdminAuthContext";

const Home = lazy(() => import("./pages/Home"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const PolicyPage = lazy(() => import("./pages/PolicyPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminProductFormPage = lazy(() => import("./pages/admin/AdminProductFormPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminOrderDetailPage = lazy(() => import("./pages/admin/AdminOrderDetailPage"));
const AdminPromotionsPage = lazy(() => import("./pages/admin/AdminPromotionsPage"));
const AdminPromotionFormPage = lazy(() => import("./pages/admin/AdminPromotionFormPage"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function StorefrontApp() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
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
      </main>
      <Footer />
      <CartDrawer />
      <AccountModal />
      <WhatsAppButton />
    </div>
  );
}

function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="produtos" element={<AdminProductsPage />} />
          <Route path="produtos/novo" element={<AdminProductFormPage />} />
          <Route path="produtos/:id" element={<AdminProductFormPage />} />
          <Route path="categorias" element={<AdminCategoriesPage />} />
          <Route path="promocoes" element={<AdminPromotionsPage />} />
          <Route path="promocoes/novo" element={<AdminPromotionFormPage />} />
          <Route path="promocoes/:id" element={<AdminPromotionFormPage />} />
          <Route path="pedidos" element={<AdminOrdersPage />} />
          <Route path="pedidos/:id" element={<AdminOrderDetailPage />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-neutral-400">Carregando…</div>}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/*" element={<StorefrontApp />} />
        </Routes>
      </Suspense>
    </>
  );
}
