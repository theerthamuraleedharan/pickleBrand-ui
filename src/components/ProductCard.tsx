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

export function ProductCard({product,
}: ProductCardProps) {
  const { items, addItem } = useCart();
  const quantityInCart = items.find(item => item.product.id === product.id)?.quantity ?? 0;
  const outOfStock = product.stockQuantity <= 0 || !product.active;
  const atLimit = quantityInCart >= product.stockQuantity;
   const imageUrl = resolveImageUrl(product.imageUrl);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_5px_22px_-12px_rgba(15,23,42,0.25)] transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={product.name}
          className="h-56 w-full bg-slate-100 object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-56 items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-100">
          <span
            className="text-6xl drop-shadow-sm"
            role="img"
            aria-label="Pickle jar"
          >
            
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {product.name}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {product.weightGrams} g
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
            {product.spiceLevel}
          </span>
        </div>

        <p className="mt-4 line-clamp-3 min-h-18 text-sm leading-6 text-slate-600">
          {product.description}
        </p>

        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          {product.category.replace("_", " ")} · {product.weightGrams} g
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-5">
          <div>
            <p className="text-xl font-black tracking-tight text-emerald-900 sm:text-2xl">
              {priceFormatter.format(product.price)}
            </p>

            <p
              className={`mt-1 text-sm ${
                outOfStock
                  ? "text-red-600"
                    : "text-slate-500"
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
            className="rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
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
