import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { consumePostLoginRoute, getRoleHome } from "../auth/oidc";
import { useAuth } from "../contexts/AuthContext";

export function OidcCallbackPage() {
  const navigate = useNavigate();
  const { user, authStatus, authError, logout, startLogin } = useAuth();

  useEffect(() => {
    if (authStatus !== "ready" || !user) return;
    navigate(consumePostLoginRoute() ?? getRoleHome(user.role), {
      replace: true,
    });
  }, [authStatus, navigate, user]);

  if (authStatus === "loading" || (authStatus === "ready" && user)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-amber-50 px-6">
        <p role="status" className="text-lg font-semibold text-emerald-900">
          Completing secure sign-in…
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-amber-50 px-6">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-black text-gray-900">
          {authStatus === "error" ? "Sign-in needs attention" : "Sign-in was not completed"}
        </h1>
        <p role="alert" className="mt-3 text-gray-600">
          {authError ?? "Return to sign-in and try again."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void startLogin().catch(() => undefined)}
            className="rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white"
          >
            Sign in with Keycloak
          </button>
          <button
            type="button"
            onClick={() => void logout().catch(() => undefined)}
            className="rounded-xl border border-emerald-800 px-5 py-3 font-bold text-emerald-900"
          >
            Sign out / change account
          </button>
          {authStatus === "error" && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700"
            >
              Reload the application
            </button>
          )}
          <Link to="/login" className="px-2 py-3 font-semibold text-emerald-800">
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}
