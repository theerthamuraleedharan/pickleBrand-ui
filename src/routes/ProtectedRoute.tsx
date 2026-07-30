import type { PropsWithChildren } from "react";
import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

export function ProtectedRoute({
  children,
}: PropsWithChildren) {
  const { authenticated } = useAuth();
  const location = useLocation();

  if (!authenticated) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}