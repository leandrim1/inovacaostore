import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Se true, também exige e-mail verificado (ex.: checkout). */
  requireVerified?: boolean;
}

export function ProtectedRoute({ children, requireVerified = false }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const redirectTarget = encodeURIComponent(location.pathname + location.search);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-neutral-400">
        Carregando…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${redirectTarget}`} replace />;
  }

  if (requireVerified && !user?.emailVerified) {
    return <Navigate to={`/verificar-email?redirect=${redirectTarget}`} replace />;
  }

  return children;
}
