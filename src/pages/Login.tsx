import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

import { login } from "../api/authApi";
import { useAuth } from "../contexts/AuthContext";

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: string; message?: string }
      | undefined;

    return (
      data?.detail ??
      data?.message ??
      "Login failed"
    );
  }

  return "An unexpected error occurred";
}

export function LoginPage() {
  const navigate = useNavigate();
  const {
    authenticated,
    completeAuthentication,
  } = useAuth();

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

      const response = await login({
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
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-emerald-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-amber-400/20" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-orange-400/20" />

        <div className="relative">
          <p className="text-xl font-black tracking-wide">
            Sujus Pickle
          </p>
        </div>

        <div className="relative max-w-xl">
          <p className="font-semibold uppercase tracking-[0.25em] text-amber-300">
            Traditional homemade flavour
          </p>

          <h1 className="mt-5 text-5xl font-black leading-tight">
            Authentic pickles,
            prepared with care.
          </h1>

          <p className="mt-6 text-lg leading-8 text-emerald-100">
            Discover mango, lemon, garlic and seasonal
            pickles made from traditional family recipes.
          </p>
        </div>

        <p className="relative text-sm text-emerald-200">
          Fresh ingredients - Authentic spices - Homemade
        </p>
      </section>

      <section className="flex items-center justify-center bg-amber-50 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="text-2xl font-black text-emerald-900">
              Sujus Pickle
            </p>
          </div>

          <div className="rounded-3xl bg-white p-7 shadow-xl shadow-emerald-950/5 sm:p-9">
            <div className="mb-7">
              <h2 className="text-3xl font-black text-gray-900">
                Welcome back
              </h2>

              <p className="mt-2 text-gray-500">
                Login to explore our homemade pickles.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
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
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
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
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
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
                className="w-full rounded-xl bg-emerald-800 px-5 py-3.5 font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Please wait..." : "Login"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
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
