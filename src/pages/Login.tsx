import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { login } from "../api/authApi";
import { useAuth } from "../contexts/AuthContext";
import { sanitizeInternalRoute } from "../auth/oidc";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

export function LoginPage() {
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
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);
  const returnTo = sanitizeInternalRoute(
    (location.state as { from?: unknown } | null)?.from,
  );

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
      setLoading(true);
      setErrorMessage(null);

      const response = await login({
        email,
        password,
      });

      completeAuthentication(response);
      navigate(
        response.user.role === "ADMIN" ? "/admin" : "/products",
        { replace: true }
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Login failed")
      );
    } finally {
      setLoading(false);
    }
  }

  if (oidcEnabled && authStatus === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-amber-50">
        <p role="status" className="font-semibold text-emerald-900">
          Checking your sign-in session…
        </p>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen bg-[#f7f7f2] lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-emerald-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10 bg-emerald-700/30" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full border border-white/10 bg-amber-400/10" />

        <div className="relative">
          <p className="text-xl font-black tracking-wide">
            Sujus Pickle
          </p>
        </div>

        <div className="relative max-w-xl">
          <p className="font-semibold uppercase tracking-[0.25em] text-amber-200">
            From our kitchen to yours
          </p>

          <h1 className="mt-5 text-5xl font-black leading-[1.08] tracking-tight xl:text-6xl">
            Authentic pickles,
            <span className="block text-amber-200">prepared with care.</span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-emerald-100">
            Discover mango, lemon, garlic and seasonal
            pickles made from traditional family recipes.
          </p>
        </div>

        <p className="relative text-sm font-medium text-emerald-200">
          Thoughtfully prepared · Authentically delicious
        </p>
      </section>

      <section className="flex items-center justify-center bg-[#f7f7f2] px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="text-2xl font-black text-emerald-900">
              Sujus Pickle
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-7 shadow-[0_24px_80px_-35px_rgba(15,23,42,0.28)] sm:p-9">
            {authStatus === "expired" && (
              <div role="status" className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-amber-700" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4m0 4h.01" />
                  </svg>
                </span>
                <span>
                  <span className="block text-sm font-bold">Your session has ended</span>
                  <span className="mt-1 block text-sm leading-5 text-amber-900">
                    Sign in again to continue. Your account and cart are safe.
                  </span>
                </span>
              </div>
            )}
            <div className="mb-7">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Customer account</p>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-slate-600">
                Login to explore our homemade pickles.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {oidcEnabled && authError && authStatus !== "expired" && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {authError}
                </div>
              )}
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">
                  Email
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                  maxLength={255}
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 placeholder:text-slate-400"
                  placeholder="name@example.com"
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
                  maxLength={72}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 placeholder:text-slate-400"
                  placeholder="Minimum 8 characters"
                />
              </label>

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-950 px-5 py-3.5 font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Please wait..." : "Login"}
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-bold text-slate-800 transition hover:border-emerald-700 hover:bg-emerald-50"
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

            <p className="mt-6 text-center text-sm text-slate-600">
              New to Sujus Pickle?{" "}
              <Link
                to="/register"
                className="font-bold text-emerald-800 hover:text-emerald-900"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
