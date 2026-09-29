import {
  useState,
  type FormEvent,
} from "react";

import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { login } from "../api/authApi";
import { sanitizeInternalRoute } from "../auth/oidc";
import { useAuth } from "../contexts/AuthContext";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    authenticated,
    completeAuthentication,
    user,
    oidcEnabled,
    authStatus,
    authError,
    startLogin,
    logout,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [submitting, setSubmitting] =
    useState(false);
  const returnTo =
    sanitizeInternalRoute(
      (location.state as { from?: unknown } | null)?.from,
    ) ?? "/admin";

  if (authenticated) {
    return (
      <Navigate
        to={user?.role === "ADMIN" ? "/admin" : "/products"}
        replace
      />
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const response = await login({
        email,
        password,
      });

      if (response.user.role !== "ADMIN") {
        setErrorMessage(
          "This account does not have administrator access."
        );

        return;
      }

      completeAuthentication(response);

      navigate("/admin", {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error)
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (oidcEnabled && authStatus === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-emerald-950 px-6">
        <p role="status" className="font-semibold text-white">
          Checking your sign-in session…
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-950 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
            🫙
          </div>

          <p className="mt-5 text-sm font-bold uppercase tracking-[0.25em] text-emerald-700">
            Sujus Pickle
          </p>

          <h1 className="mt-2 text-3xl font-black text-gray-900">
            Admin login
          </h1>

          <p className="mt-2 text-gray-500">
            Sign in to manage the store.
          </p>
        </div>

        {authStatus === "expired" && (
          <div role="status" className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-amber-700" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4m0 4h.01" />
              </svg>
            </span>
            <span>
              <span className="block text-sm font-bold">Your session has ended</span>
              <span className="mt-1 block text-sm leading-5 text-amber-900">
                Sign in again to continue managing your store.
              </span>
            </span>
          </div>
        )}

        {oidcEnabled && authError && authStatus !== "expired" && (
          <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {authError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-700">
              Admin email
            </span>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              autoComplete="email"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-700">
              Password
            </span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Signing in..."
              : "Sign in as administrator"}
          </button>
        </form>
        {oidcEnabled && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              or
              <span className="h-px flex-1 bg-gray-200" />
            </div>
            <button
              type="button"
              onClick={() => void startLogin(returnTo).catch(() => undefined)}
              className="w-full rounded-xl border border-emerald-800 px-5 py-3 font-bold text-emerald-900 transition hover:bg-emerald-50"
            >
              Sign in with Keycloak
            </button>
            {authError && (
              <button
                type="button"
                onClick={() => void logout().catch(() => undefined)}
                className="mt-3 w-full rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700"
              >
                Sign out of Keycloak / change account
              </button>
            )}
          </>
        )}
        <p className="mt-5 text-center text-sm">
          <Link to="/login" className="font-semibold text-emerald-800">
            Customer sign-in
          </Link>
        </p>
      </div>
    </main>
  );
}
