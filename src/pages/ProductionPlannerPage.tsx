import { useEffect, useMemo, useState } from "react";

import { getAdminProducts } from "../api/AdminProductApi";
import { AdminHeader } from "../components/admin/AdminHeader";
import type { AdminProduct } from "../types/AdminProduct";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import { calculateProductionPlan } from "../utils/productionPlanner";

const defaultDailyDemand = "5";
const chartWidth = 640;
const chartHeight = 220;
const chartPadding = 24;

function statusLabel(status: "out" | "plan" | "healthy"): string {
  if (status === "out") return "Out of stock";
  if (status === "plan") return "Plan a batch";
  return "Stock looks good";
}

function statusClass(status: "out" | "plan" | "healthy"): string {
  if (status === "out") return "bg-red-50 text-red-800 ring-red-200";
  if (status === "plan") return "bg-amber-50 text-amber-900 ring-amber-200";
  return "bg-emerald-50 text-emerald-800 ring-emerald-200";
}

export function ProductionPlannerPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [dailyDemand, setDailyDemand] = useState<Record<number, string>>({});
  const [leadTimeDays, setLeadTimeDays] = useState("7");
  const [safetyDays, setSafetyDays] = useState("2");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignoreResult = false;

    async function loadProducts() {
      try {
        const result = await getAdminProducts();
        if (ignoreResult) return;

        const activeProducts = result.filter((product) => product.active);
        setProducts(activeProducts);
        setDailyDemand(
          Object.fromEntries(
            activeProducts.map((product) => [
              product.id,
              defaultDailyDemand,
            ]),
          ),
        );
        setSelectedProductId(activeProducts[0]?.id ?? null);
      } catch (error) {
        if (!ignoreResult) {
          setErrorMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!ignoreResult) {
          setLoading(false);
        }
      }
    }

    void loadProducts();
    return () => {
      ignoreResult = true;
    };
  }, []);

  const leadTime = Number(leadTimeDays);
  const safetyBuffer = Number(safetyDays);
  const estimates = useMemo(
    () =>
      products.map((product) => {
        const demand = Number(dailyDemand[product.id] ?? defaultDailyDemand);
        return {
          product,
          demand: Number.isFinite(demand) ? Math.max(0, demand) : 0,
          plan: calculateProductionPlan(
            product.stockQuantity,
            demand,
            leadTime,
            safetyBuffer,
          ),
        };
      }),
    [dailyDemand, leadTime, products, safetyBuffer],
  );

  const planCount = estimates.filter(
    ({ plan }) => plan.status !== "healthy",
  ).length;
  const totalRecommendedBatch = estimates.reduce(
    (total, { plan }) => total + plan.recommendedBatch,
    0,
  );
  const selectedEstimate = estimates.find(
    ({ product }) => product.id === selectedProductId,
  ) ?? estimates[0];

  const plot = selectedEstimate
    ? (() => {
        const { product, demand, plan } = selectedEstimate;
        const maxStock = Math.max(
          product.stockQuantity,
          plan.targetStock,
          1,
        );
        const plotHeight = chartHeight - chartPadding * 2;
        const plotWidth = chartWidth - chartPadding * 2;
        const yForStock = (stock: number) =>
          chartHeight -
          chartPadding -
          (Math.max(0, stock) / maxStock) * plotHeight;
        const points = Array.from({ length: 31 }, (_, day) => {
          const x = chartPadding + (day / 30) * plotWidth;
          const stock = Math.max(0, product.stockQuantity - demand * day);
          return `${x},${yForStock(stock)}`;
        });

        return {
          points: points.join(" "),
          targetY: yForStock(plan.targetStock),
          stockoutDay: plan.daysUntilStockout,
        };
      })()
    : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader
        title="Production planner"
        subtitle="Explore stock cover and plan production using editable demand assumptions."
      />

      <section className="mx-auto max-w-7xl space-y-7 px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Inventory scenario</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Plan before stock runs low
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Adjust expected daily demand and production timing to see a simple 30-day stock projection.
            </p>
          </div>
          <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900">
            Scenario estimates · Not order history
          </span>
        </div>

        {errorMessage && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <section aria-label="Planning assumptions" className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">Production lead time</span>
            <span className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="365"
                step="1"
                value={leadTimeDays}
                onChange={(event) => setLeadTimeDays(event.target.value)}
                className="w-32 rounded-xl border border-slate-300 px-4 py-3"
              />
              <span className="text-sm text-slate-500">days from starting a batch to ready stock</span>
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">Safety buffer</span>
            <span className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="365"
                step="1"
                value={safetyDays}
                onChange={(event) => setSafetyDays(event.target.value)}
                className="w-32 rounded-xl border border-slate-300 px-4 py-3"
              />
              <span className="text-sm text-slate-500">extra days of stock to keep on hand</span>
            </span>
          </label>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Active products</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{products.length}</p>
          </article>
          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-amber-900">Need a production plan</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-amber-950">{planCount}</p>
          </article>
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-emerald-900">Suggested total batch</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-emerald-950">
              {totalRecommendedBatch.toLocaleString()} <span className="text-base font-semibold">jars</span>
            </p>
          </article>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <h3 className="text-lg font-bold text-slate-950">Product demand assumptions</h3>
            <p className="mt-1 text-sm text-slate-500">
              Starting values are sample inputs of 5 jars/day. Replace them with your own planning estimates.
            </p>
          </div>
          {loading ? (
            <p className="p-6 text-sm text-slate-600" role="status">Loading catalogue...</p>
          ) : products.length === 0 ? (
            <p className="p-6 text-sm text-slate-600">There are no active products to plan. Activate a product in the catalogue to include it here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Product</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Current stock</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Expected demand</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Stock cover</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Production suggestion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {estimates.map(({ product, plan }) => (
                    <tr
                      key={product.id}
                      onClick={() => setSelectedProductId(product.id)}
                      className={`cursor-pointer transition hover:bg-emerald-50/50 ${product.id === selectedEstimate?.product.id ? "bg-emerald-50/40" : ""}`}
                    >
                      <th scope="row" className="px-5 py-4 font-semibold text-slate-900">
                        {product.name}
                        <span className="mt-1 block text-xs font-normal text-slate-500">{product.weightGrams} g per jar</span>
                      </th>
                      <td className="px-5 py-4 text-sm text-slate-700">{product.stockQuantity} jars</td>
                      <td className="px-5 py-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="1000000"
                            step="0.5"
                            aria-label={`Expected daily demand for ${product.name}`}
                            value={dailyDemand[product.id] ?? defaultDailyDemand}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) =>
                              setDailyDemand((current) => ({
                                ...current,
                                [product.id]: event.target.value,
                              }))
                            }
                            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <span className="text-xs text-slate-500">jars/day</span>
                        </label>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusClass(plan.status)}`}>
                          {statusLabel(plan.status)}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {plan.daysUntilStockout === null
                            ? "No demand entered"
                            : `${plan.daysUntilStockout.toFixed(1)} days at this rate`}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {plan.recommendedBatch > 0
                          ? `Prepare ${plan.recommendedBatch} jars`
                          : "No batch needed"}
                        <span className="mt-1 block text-xs font-normal text-slate-500">
                          {plan.recommendedBatch > 0
                            ? `Target: ${Math.ceil(plan.targetStock)} jars`
                            : `~${Math.max(0, Math.floor(plan.projectedStockAtLeadTime))} jars at lead time`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedEstimate && plot && (
          <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(16rem,1fr)]">
            <div className="min-w-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">30-day projection</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-950">{selectedEstimate.product.name}</h3>
                </div>
                <label className="text-sm font-medium text-slate-600">
                  View product
                  <select
                    value={selectedEstimate.product.id}
                    onChange={(event) => setSelectedProductId(Number(event.target.value))}
                    className="ml-2 max-w-48 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                  >
                    {estimates.map(({ product }) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl bg-slate-50 p-3">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  role="img"
                  aria-label={`Projected stock for ${selectedEstimate.product.name} over 30 days at ${selectedEstimate.demand} jars per day`}
                  className="h-auto w-full"
                >
                  {[0, 0.5, 1].map((fraction) => {
                    const y = chartPadding + fraction * (chartHeight - chartPadding * 2);
                    return <line key={fraction} x1={chartPadding} x2={chartWidth - chartPadding} y1={y} y2={y} stroke="#dbe3e8" strokeDasharray="4 5" />;
                  })}
                  <line
                    x1={chartPadding}
                    x2={chartWidth - chartPadding}
                    y1={plot.targetY}
                    y2={plot.targetY}
                    stroke="#d9984e"
                    strokeDasharray="6 5"
                  />
                  <polyline
                    points={plot.points}
                    fill="none"
                    stroke="#155b43"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <text x={chartPadding} y={chartHeight - 4} fill="#64748b" fontSize="12">Today</text>
                  <text x={chartWidth - chartPadding} y={chartHeight - 4} fill="#64748b" fontSize="12" textAnchor="end">Day 30</text>
                  <text x={chartWidth - chartPadding} y={Math.max(chartPadding + 12, plot.targetY - 6)} fill="#9a5b17" fontSize="12" textAnchor="end">Reorder target</text>
                </svg>
              </div>
            </div>
            <aside className="flex flex-col justify-center rounded-2xl bg-emerald-950 p-5 text-white">
              <p className="text-sm font-semibold text-emerald-200">At this demand rate</p>
              <p className="mt-2 text-3xl font-black tracking-tight">
                {plot.stockoutDay === null ? "No demand" : `${plot.stockoutDay.toFixed(1)} days`}
              </p>
              <p className="mt-1 text-sm text-emerald-100">estimated stock cover</p>
              <div className="my-5 h-px bg-white/15" />
              <p className="text-sm leading-6 text-emerald-100">
                {selectedEstimate.plan.recommendedBatch > 0
                  ? `Consider preparing ${selectedEstimate.plan.recommendedBatch} jars to cover the ${leadTimeDays}-day production lead time and ${safetyDays}-day safety buffer.`
                  : "Current stock covers the selected lead time and safety buffer under this scenario."}
              </p>
            </aside>
          </section>
        )}

        <details className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          <summary className="cursor-pointer font-semibold text-slate-800">How the estimate works</summary>
          <div className="mt-3 space-y-2 leading-6">
            <p><strong>Reorder target</strong> = expected jars per day × (lead-time days + safety-buffer days).</p>
            <p><strong>Suggested batch</strong> = reorder target minus current stock, rounded up to a whole jar. It is never less than zero.</p>
            <p><strong>Stock cover</strong> = current stock ÷ expected jars per day. This is a planning aid, not a sales forecast; the assumptions are entered by the user and are not based on order history.</p>
          </div>
        </details>
      </section>
    </main>
  );
}
