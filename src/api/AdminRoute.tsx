import type {
  PropsWithChildren,
} from "react";

import { Navigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

export function AdminRoute({
  children,
}: PropsWithChildren) {
  const {
    authenticated,
    user,
  } = useAuth();

  if (!authenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
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