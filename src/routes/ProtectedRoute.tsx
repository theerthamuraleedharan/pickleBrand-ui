import type { PropsWithChildren } from "react";
import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

export function ProtectedRoute({
  children,
}: PropsWithChildren) {
  const { authenticated, authStatus } = useAuth();
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
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  return children;
}
