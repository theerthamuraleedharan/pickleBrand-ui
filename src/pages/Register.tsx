import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

import { register } from "../api/authApi";
import { useAuth } from "../contexts/AuthContext";

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: string; message?: string }
      | undefined;

    return (
      data?.detail ??
      data?.message ??
      "Registration failed"
    );
  }

  return "An unexpected error occurred";
}

export function RegisterPage() {
  const navigate = useNavigate();
  const {
    authenticated,
    completeAuthentication,
    oidcEnabled,
    oidcSessionActive,
    startLogin,
    authError,
    accountLinkingRequired,
    logout,
  } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  if (authenticated) {
    return <Navigate to="/products" replace />;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setErrorMessage(null);

      const response = await register({
        firstName,
        lastName,
        email,
        password,
      });

      completeAuthentication(response);
      navigate("/products", { replace: true });
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
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
            Your next
            <span className="block text-amber-200">favourite jar awaits.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-emerald-100">
            Create an account to discover homemade mango, lemon, garlic and seasonal pickles.
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
            <div className="mb-7">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Join our pantry</p>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Create your account
              </h2>

              <p className="mt-2 text-slate-600">
                Register to begin shopping with us.
              </p>
            </div>

            {oidcEnabled && authError && (
              <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {authError}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    First name
                  </span>

                  <input
                    value={firstName}
                    onChange={(event) =>
                      setFirstName(event.target.value)
                    }
                    required
                    maxLength={100}
                    autoComplete="given-name"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 placeholder:text-slate-400"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    Last name
                  </span>

                  <input
                    value={lastName}
                    onChange={(event) =>
                      setLastName(event.target.value)
                    }
                    required
                    maxLength={100}
                    autoComplete="family-name"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 placeholder:text-slate-400"
                  />
                </label>
              </div>

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
                  autoComplete="new-password"
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
                {loading
                  ? "Please wait..."
                  : "Create account"}
              </button>
            </form>

            {oidcEnabled && (
              <>
                <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <span className="h-px flex-1 bg-gray-200" />
                  or
                  <span className="h-px flex-1 bg-gray-200" />
                </div>
                {!accountLinkingRequired && (
                  <>
                    <button
                      type="button"
                      onClick={() => void startLogin("/products").catch(() => undefined)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-bold text-slate-800 transition hover:border-emerald-700 hover:bg-emerald-50"
                    >
                      Use an existing Keycloak account
                    </button>
                    <button
                      type="button"
                      onClick={() => void startLogin("/products", "google").catch(() => undefined)}
                      className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-bold text-slate-800 transition hover:border-emerald-700 hover:bg-emerald-50"
                    >
                      Continue with Google
                    </button>
                  </>
                )}
                {oidcSessionActive && (
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
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-emerald-800 hover:text-emerald-900"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
