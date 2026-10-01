import { Link } from "react-router-dom";
import { useState } from "react";
import { Header } from "../components/layout/Header";
import { CheckoutPanel } from "../components/checkout/CheckoutPanel";
import { useCart } from "../contexts/cartContext";
import { resolveImageUrl } from "../utils/resolveImageUrl";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    setQuantity,
    removeItem,
    clearCart,
    storageError,
    cartStatus,
    cartError,
    refreshCart,
  } = useCart();
  const [checkoutStarted, setCheckoutStarted] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <section className={`mx-auto px-5 py-10 sm:px-8 lg:py-14 ${checkoutStarted ? "max-w-6xl" : "max-w-7xl"}`}>
        {!checkoutStarted && <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950">← Continue shopping</Link>}
        {!checkoutStarted && (
          <div className="my-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Your selection</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Your cart</h1>
            </div>
            {cartStatus === "ready" && items.length > 0 && <button type="button" onClick={() => void clearCart().catch(() => undefined)} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50">Clear cart</button>}
          </div>
        )}
        {!checkoutStarted && storageError && <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">Your cart is available for this visit, but could not be cached in this browser.</p>}
        {!checkoutStarted && cartStatus === "loading" && (
          <div role="status" className="rounded-3xl border border-slate-200 bg-white p-8 text-base font-semibold text-slate-700 shadow-sm">
            Loading your cart…
          </div>
        )}
        {!checkoutStarted && cartStatus === "error" && (
          <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Your cart couldn’t be loaded</h2>
            <p role="alert" className="mt-2 text-base text-red-800">{cartError}</p>
            <button type="button" onClick={() => void refreshCart().catch(() => undefined)} className="mt-5 rounded-xl bg-emerald-950 px-5 py-3 font-bold text-white hover:bg-emerald-800">
              Retry loading cart
            </button>
          </div>
        )}
        {!checkoutStarted && cartStatus === "unauthenticated" && (
          <p role="alert" className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-base text-amber-950">
            Sign in to load and manage your cart.
          </p>
        )}
        {checkoutStarted ? (
          <CheckoutPanel mode="cart" items={items} />
        ) : cartStatus === "ready" && items.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl" aria-hidden="true">🫙</div>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">Your cart is empty</h2>
            <p className="mt-3 text-slate-600">Find your favourite pickles and add them here.</p>
            <Link to="/products" className="mt-6 inline-flex rounded-xl bg-emerald-950 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800">Explore pickles</Link>
          </div>
        ) : (
          cartStatus === "ready" && items.length > 0 ? <div className="grid items-start gap-8 lg:grid-cols-[2fr_1fr]">
            <ul className="space-y-4">
              {items.map(({ product, quantity }) => {
                const image = resolveImageUrl(product.imageUrl);
                const id = product.id!;
                return (
                  <li key={id} className="flex flex-wrap gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    {image ? <img src={image} alt={product.name} className="h-24 w-24 rounded-xl object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-amber-100 text-3xl" aria-hidden="true">🫙</div>}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold text-slate-900">{product.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">{product.weightGrams} g · {money.format(product.price)} each</p>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <div className="flex items-center rounded-xl border border-slate-200">
                          <button type="button" aria-label={`Decrease quantity of ${product.name}`} disabled={quantity === 1 || cartStatus !== "ready"} onClick={() => void setQuantity(id, quantity - 1).catch(() => undefined)} className="h-10 w-10 font-bold disabled:opacity-30">−</button>
                          <span className="min-w-8 text-center" aria-live="polite" aria-label={`Quantity of ${product.name}`}>{quantity}</span>
                          <button type="button" aria-label={`Increase quantity of ${product.name}`} disabled={quantity >= product.stockQuantity || cartStatus !== "ready"} onClick={() => void setQuantity(id, quantity + 1).catch(() => undefined)} className="h-10 w-10 font-bold disabled:opacity-30">+</button>
                        </div>
                        <button type="button" aria-label={`Remove ${product.name} from cart`} disabled={cartStatus !== "ready"} onClick={() => void removeItem(id).catch(() => undefined)} className="text-sm font-semibold text-red-700 underline disabled:cursor-not-allowed disabled:opacity-50">Remove</button>
                      </div>
                      {quantity >= product.stockQuantity && <p className="mt-2 text-sm text-amber-800">Maximum available quantity reached.</p>}
                    </div>
                    <p className="font-bold text-emerald-800">{money.format(Math.round(product.price * 100) * quantity / 100)}</p>
                  </li>
                );
              })}
            </ul>
            <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28">
              <h2 className="text-xl font-bold text-slate-900">Cart summary</h2>
              <div className="mt-6 flex justify-between gap-4"><span>Items</span><span aria-live="polite">{itemCount}</span></div>
              <div className="mt-4 flex justify-between gap-4 border-t border-slate-200 pt-4 text-xl font-bold text-emerald-950"><span>Subtotal</span><span aria-live="polite">{money.format(subtotal)}</span></div>
              <p className="mt-5 text-sm leading-6 text-slate-600">Review your saved delivery address and order total before placing your order.</p>
              {!storageError && <p className="mt-3 text-xs text-slate-500">Your cart is saved in this browser for your next visit.</p>}
              <button type="button" onClick={() => setCheckoutStarted(true)} className="mt-5 w-full rounded-xl bg-emerald-950 px-5 py-3 font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-emerald-700">
                Proceed to checkout
              </button>
            </aside>
          </div> : null
        )}
      </section>
    </main>
  );
}
