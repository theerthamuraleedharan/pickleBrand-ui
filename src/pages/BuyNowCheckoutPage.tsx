import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getProduct } from "../api/productApi";
import { CheckoutPanel } from "../components/checkout/CheckoutPanel";
import { Header } from "../components/layout/Header";
import type { Product } from "../types/Product";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

export function BuyNowCheckoutPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    const id = Number(productId);

    async function loadProduct() {
      if (!Number.isSafeInteger(id) || id <= 0) {
        setError("This product could not be found.");
        setProduct(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await getProduct(id);
        if (mounted) setProduct(result);
      } catch (loadError) {
        if (mounted) {
          setProduct(null);
          setError(getApiErrorMessage(loadError, "Product details could not be loaded. Please try again."));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadProduct();
    return () => {
      mounted = false;
    };
  }, [productId, loadAttempt]);

  const unavailable = product && (!product.active || product.stockQuantity <= 0);

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950">
          ← Continue shopping
        </Link>
        <div className="mt-6">
          {loading ? (
            <p role="status" className="rounded-3xl border border-slate-200 bg-white p-8 text-base font-semibold text-slate-700 shadow-sm">
              Loading product and checkout…
            </p>
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
              <h1 className="text-2xl font-black text-slate-950">Checkout is unavailable</h1>
              <p role="alert" className="mt-3 text-base text-red-800">{error}</p>
              <button
                type="button"
                onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                className="mt-5 rounded-xl bg-emerald-950 px-5 py-3 font-bold text-white transition hover:bg-emerald-800"
              >
                Retry
              </button>
            </div>
          ) : unavailable ? (
            <div className="rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
              <h1 className="text-2xl font-black text-slate-950">This product is unavailable</h1>
              <p className="mt-3 text-base text-slate-700">It is currently out of stock or no longer available. Please choose another product.</p>
            </div>
          ) : product ? (
            <CheckoutPanel mode="buy-now" items={[{ product, quantity: 1 }]} />
          ) : null}
        </div>
      </section>
    </main>
  );
}
