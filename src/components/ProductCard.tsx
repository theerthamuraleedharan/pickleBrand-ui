import type { Product } from "../types/Product";

interface ProductCardProps {
  product: Product;
}

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

export function ProductCard({
  product,
}: ProductCardProps) {
  const outOfStock = product.stockQuantity === 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-52 w-full object-cover"
        />
      ) : (
        <div className="flex h-52 items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200">
          <span
            className="text-6xl"
            role="img"
            aria-label="Pickle jar"
          >
            🫙
          </span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {product.name}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {product.weightGrams} g
            </p>
          </div>

          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
            {product.spiceLevel}
          </span>
        </div>

        <p className="mt-4 line-clamp-3 min-h-18 text-sm leading-6 text-gray-600">
          {product.description}
        </p>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-bold text-emerald-700">
              {priceFormatter.format(product.price)}
            </p>

            <p
              className={`mt-1 text-sm ${
                outOfStock
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {outOfStock
                ? "Out of stock"
                : `${product.stockQuantity} available`}
            </p>
          </div>

          <button
            type="button"
            disabled={outOfStock}
            className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}