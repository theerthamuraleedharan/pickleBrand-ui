import {
  useState,
  type FormEvent,
} from "react";

import { Navigate, useNavigate } from "react-router-dom";

import { login } from "../api/authApi";
import { useAuth } from "../contexts/AuthContext";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

export function AdminLoginPage() {
  const navigate = useNavigate();

  const {
    authenticated,
    completeAuthentication,
    user,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

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
      </div>
    </main>
  );
}
