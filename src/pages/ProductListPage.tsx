import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { getProducts } from "../api/productApi";
import { ProductCard } from "../components/ProductCard";
import { Header } from "../components/layout/Header";
import { CategoryFilterBar } from "../components/products/CategoryFilterBar";
import type { CategoryFilter } from "../components/products/CategoryFilterBar";
import type {
  Product,
} from "../types/Product";

const categoryTitles: Record<CategoryFilter, string> = {
  ALL: "All Pickles",
  VEG: "Vegetarian Pickles",
  NON_VEG: "Non-Vegetarian Pickles",
  MIXED: "Mixed Pickles",
};

export function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let ignoreResult = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const result = await getProducts();

        if (!ignoreResult) {
          setProducts(result);
        }
      } catch (error) {
        console.error("Failed to load products", error);

        if (!ignoreResult) {
          setErrorMessage(
            "Products could not be loaded. Check whether the backend is running."
          );
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

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "ALL" ||
        product.category === selectedCategory;
      const searchableText = [
        product.name,
        product.description,
        product.spiceLevel,
        product.category.replace("_", " "),
      ]
        .join(" ")
        .toLocaleLowerCase();

      return (
        matchesCategory &&
        (!normalizedQuery || searchableText.includes(normalizedQuery))
      );
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <Header />

      <section className="relative isolate overflow-hidden bg-emerald-950 px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="absolute inset-0 -z-10 opacity-50" aria-hidden="true">
          <div className="absolute -right-24 -top-44 h-[34rem] w-[34rem] rounded-full border border-amber-100/15" />
          <div className="absolute -right-8 -top-28 h-[24rem] w-[24rem] rounded-full border border-amber-100/15" />
          <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-emerald-700/30 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-100/20 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              Made with care, shared with love
            </p>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              A little tradition
              <span className="block text-amber-200">in every jar.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-100 sm:text-lg sm:leading-8">
              Discover small-batch mango, lemon, garlic and seasonal pickles, prepared with traditional family recipes.
            </p>
          </div>
          <div className="hidden h-48 w-48 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-8xl shadow-2xl shadow-black/20 lg:flex" aria-hidden="true">
            🫙
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-7 max-w-7xl px-4 pt-0 sm:px-6 lg:px-8">
        <CategoryFilterBar
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        <div className="mt-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
              The pantry
            </p>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              {categoryTitles[selectedCategory]}
            </h2>

            <p className="mt-2 text-slate-600">
              Search by pickle name, ingredients, or spice level.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <label className="relative block w-full sm:min-w-80 lg:w-96">
              <span className="sr-only">Search pickles</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search pickles..."
                autoComplete="off"
                className="w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-12 pr-12 text-base text-slate-900 shadow-sm placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear pickle search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Clear
                </button>
              )}
            </label>

            {!loading && !errorMessage && (
              <p aria-live="polite" className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            Loading products...
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {errorMessage}
          </div>
        )}

        {!loading &&
          !errorMessage &&
          products.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              No products are currently available.
            </div>
          )}

        {!loading &&
          !errorMessage &&
          products.length > 0 &&
          filteredProducts.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">No pickles found</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
                {searchQuery.trim()
                  ? `We couldn't find a pickle matching "${searchQuery.trim()}". Try another name, ingredient, or spice level.`
                  : "No pickles are currently available in this category. Select All to see every pickle."}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-4 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

        {!loading &&
          !errorMessage &&
          products.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          )}
      </section>
    </main>
  );
}
