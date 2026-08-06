import {
  useEffect,
  useState,
} from "react";

import {
  getAdminDashboard,
  getAdminDashboardSummary,
  type AdminDashboardResponse,
  type AdminDashboardSummary,
} from "../api/adminApi";

import { DashboardStatCard } from "../components/admin/DashboardStatCard";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

export function AdminDashboardPage() {
  const [dashboard, setDashboard] =
    useState<AdminDashboardResponse | null>(
      null
    );

  const [summary, setSummary] =
    useState<AdminDashboardSummary | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    let ignoreResult = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const [
          dashboardResult,
          summaryResult,
        ] = await Promise.all([
          getAdminDashboard(),
          getAdminDashboardSummary(),
        ]);

        if (!ignoreResult) {
          setDashboard(dashboardResult);
          setSummary(summaryResult);
        }
      } catch (error) {
        if (!ignoreResult) {
          setErrorMessage(
            getApiErrorMessage(error)
          );
        }
      } finally {
        if (!ignoreResult) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      ignoreResult = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-emerald-950 px-6 py-7 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-300">
              Sujus Pickle
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Admin dashboard
            </h1>
          </div>

          {dashboard && (
            <div className="text-right">
              <p className="text-sm text-emerald-200">
                Logged in as
              </p>

              <p className="font-bold">
                {dashboard.email}
              </p>
            </div>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {errorMessage && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
          >
            {errorMessage}
          </div>
        )}

        {loading && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="h-40 animate-pulse rounded-2xl bg-white" />
            <div className="h-40 animate-pulse rounded-2xl bg-white" />
          </div>
        )}

        {!loading && summary && (
          <>
            {/* Top statistics bar */}
            <div className="grid gap-6 sm:grid-cols-2">
              <DashboardStatCard
                title="Total customers"
                value={summary.totalCustomers}
                description="Registered customer accounts"
                icon="👥"
              />

              <DashboardStatCard
                title="Total products"
                value={summary.totalProducts}
                description="Products available in the catalogue"
                icon="🫙"
              />
            </div>

            <section className="mt-10 rounded-2xl bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black text-gray-900">
                Store overview
              </h2>

              <p className="mt-2 text-gray-600">
                Manage your pickle products,
                customers and store activity.
              </p>
            </section>
          </>
        )}
      </section>
    </main>
  );
}