import {
  useEffect,
  useState,
} from "react";
import { Link } from "react-router-dom";

import {
  getAdminDashboard,
  getAdminDashboardSummary,
  type AdminDashboardResponse,
  type AdminDashboardSummary,
} from "../api/adminApi";

import { AdminHeader } from "../components/admin/AdminHeader";
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
      <AdminHeader
        title="Admin dashboard"
        subtitle={
          dashboard
            ? `Logged in as ${dashboard.email}`
            : "Manage store activity and catalogue health."
        }
      />

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
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">
                    Store overview
                  </h2>

                  <p className="mt-2 max-w-2xl text-gray-600">
                    Review catalogue health and keep your
                    pickle products ready for customers.
                  </p>
                </div>

                <Link
                  to="/admin/products"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white transition hover:bg-emerald-900"
                >
                  Manage products
                </Link>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
