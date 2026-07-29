import { useEffect, useState } from "react";
import { getProducts } from "../api/productApi";
import { ProductCard } from "../components/ProductCard";
import type { Product } from "../types/Product";

export function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);

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

  return (
    <main className="min-h-screen bg-amber-50">
      <section className="bg-emerald-900 px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 font-semibold uppercase tracking-widest text-amber-300">
            Homemade goodness
          </p>

          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            Traditional pickles delivered to your home
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-emerald-100">
            Explore homemade mango, lemon, garlic and
            seasonal pickles.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Our pickles
          </h2>

          <p className="mt-2 text-gray-600">
            Select your preferred flavour and spice level.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            Loading products...
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {errorMessage}
          </div>
        )}

        {!loading &&
          !errorMessage &&
          products.length === 0 && (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              No products are currently available.
            </div>
          )}

        {!loading &&
          !errorMessage &&
          products.length > 0 && (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
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