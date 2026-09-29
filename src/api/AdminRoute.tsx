import type {
  PropsWithChildren,
} from "react";

import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

export function AdminRoute({
  children,
}: PropsWithChildren) {
  const {
    authenticated,
    authStatus,
    user,
  } = useAuth();
  const location = useLocation();

  if (authStatus === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-amber-50">
        <p role="status" className="font-semibold text-emerald-900">
          Checking your session…
        </p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  if (user?.role !== "ADMIN") {
    return (
      <Navigate
        to="/products"
        replace
      />
    );
  }

  return children;
}