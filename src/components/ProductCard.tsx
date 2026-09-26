import type { Product } from "../types/Product";
import { useCart } from "../contexts/cartContext";
import { resolveImageUrl } from "../utils/resolveImageUrl";

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
  const { items, addItem } = useCart();
  const quantityInCart = items.find(item => item.product.id === product.id)?.quantity ?? 0;
  const outOfStock = product.stockQuantity <= 0 || !product.active;
  const atLimit = quantityInCart >= product.stockQuantity;
   const imageUrl = resolveImageUrl(product.imageUrl);

  return (
    <article className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      {imageUrl ? (
        <img
          src={imageUrl}
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

        <p className="mt-4 min-h-18 text-sm leading-6 text-gray-600">
          {product.category}
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
            disabled={outOfStock || atLimit || product.id === null}
            onClick={() => addItem(product)}
            className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {outOfStock ? "Unavailable" : atLimit ? "Max in cart" : "Add to cart"}
          </button>
        </div>
        <p role="status" className="mt-3 min-h-5 text-sm font-semibold text-emerald-800">
          {quantityInCart > 0 ? `${quantityInCart} in your cart` : ""}
        </p>
      </div>
    </article>
  );
}
