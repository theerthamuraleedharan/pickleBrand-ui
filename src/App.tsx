import { useEffect, useState } from "react";
import { getProducts } from "./api/productApi";
import type { Product } from "./types/Product";

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="p-8">Loading products...</p>;
  }

  return (
    <main className="min-h-screen bg-amber-50 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-4xl font-bold text-emerald-900">
          Sujus Pickle
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="rounded-2xl bg-white p-6 shadow"
            >
              <h2 className="text-xl font-bold">
                {product.name}
              </h2>

              <p className="mt-2 text-gray-600">
                {product.description}
              </p>

              <p className="mt-3 text-sm text-orange-700">
                {product.spiceLevel} · {product.weightGrams} g
              </p>

              <p className="mt-4 text-2xl font-bold text-emerald-700">
                ₹{product.price}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                {product.stockQuantity} available
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

export default App;