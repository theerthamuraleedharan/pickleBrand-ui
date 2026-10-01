import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import {
  buyNow,
  placeCartOrder,
  type BuyNowRequest,
  type OrderRequest,
  type OrderResponse,
} from "../../api/orderApi";
import { createAddress, getAddresses } from "../../api/profileApi";
import { useCart } from "../../contexts/cartContext";
import type { Address, AddressRequest } from "../../types/Profile";
import type { Product } from "../../types/Product";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";

export interface CheckoutLine {
  product: Product;
  quantity: number;
}

interface CheckoutPanelProps {
  mode: "cart" | "buy-now";
  items: CheckoutLine[];
  onClose?: () => void;
}

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

function addressText(address: Address) {
  return [
    address.recipientName,
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
    address.phone,
  ]
    .filter(Boolean)
    .join(", ");
}

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Your sign-in session is unavailable. Please sign in again before placing your order.";
    }

    if (
      (error.response?.status === 409 ||
        error.response?.status === 422) &&
      !error.response.data?.detail &&
      !error.response.data?.message
    ) {
      return "One or more items are no longer available in the requested quantity. Please update your order and try again.";
    }
  }

  return getApiErrorMessage(error, fallback);
}

function isEmptyCartError(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  const response = error.response?.data;
  const message =
    typeof response === "string"
      ? response
      : response && typeof response === "object"
        ? "detail" in response
          ? String(response.detail)
          : "message" in response
            ? String(response.message)
            : ""
        : "";
  return /cart.{0,30}empty|empty.{0,30}cart/i.test(message);
}

function orderItemName(item: OrderResponse["items"][number]) {
  return item.productName ?? item.name ?? item.product?.name ?? `Product ${item.productId ?? ""}`;
}

export function CheckoutPanel({ mode, items, onClose }: CheckoutPanelProps) {
  const {
    items: serverCartItems,
    cartStatus,
    cartError,
    refreshCart,
  } = useCart();
  const checkoutItems = mode === "cart" ? serverCartItems : items;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [deliveryAddressId, setDeliveryAddressId] = useState("");
  const [billingAddressId, setBillingAddressId] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<AddressRequest>({
    recipientName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Germany",
    defaultAddress: false,
  });
  const [quantityInput, setQuantityInput] = useState("1");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressLoadAttempt, setAddressLoadAttempt] = useState(0);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<"form" | "review" | "confirmation">("form");
  const [submitting, setSubmitting] = useState(false);
  const [checkingCart, setCheckingCart] = useState(false);
  const [postOrderCartSyncError, setPostOrderCartSyncError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const submittingRef = useRef(false);
  const attemptKey = useRef<string | null>(null);
  const attemptFingerprint = useRef<string | null>(null);
  const product = mode === "buy-now" ? items[0]?.product : undefined;
  const quantity = Number(quantityInput);
  const quantityValid =
    mode === "cart" ||
    (/^[1-9]\d*$/.test(quantityInput) &&
      Number.isSafeInteger(quantity) &&
      Boolean(product && quantity <= product.stockQuantity));
  const deliveryAddress = addresses.find(
    (address) => String(address.id) === deliveryAddressId,
  );
  const billingAddress = billingAddressId
    ? addresses.find((address) => String(address.id) === billingAddressId)
    : deliveryAddress;
  const subtotal =
    checkoutItems.reduce(
      (total, item) =>
        total + Math.round(item.product.price * 100) * item.quantity,
      0,
    ) / 100;

  useEffect(() => {
    let mounted = true;

    async function loadAddresses() {
      try {
        setLoadingAddresses(true);
        setAddressError(null);
        const result = await getAddresses();
        if (mounted) {
          setAddresses(result);
          const preferred = result.find((address) => address.defaultAddress) ?? result[0];
          setDeliveryAddressId(preferred ? String(preferred.id) : "");
        }
      } catch (loadError) {
        if (mounted) {
          setAddressError(
            errorMessage(
              loadError,
              "Saved addresses could not be loaded. Please try again.",
            ),
          );
        }
      } finally {
        if (mounted) setLoadingAddresses(false);
      }
    }

    void loadAddresses();
    return () => {
      mounted = false;
    };
  }, [addressLoadAttempt]);

  function invalidateAttempt() {
    attemptKey.current = null;
    attemptFingerprint.current = null;
  }

  function handleQuantityChange(value: string) {
    setQuantityInput(value);
    invalidateAttempt();
  }

  function handleDeliveryChange(value: string) {
    setDeliveryAddressId(value);
    invalidateAttempt();
  }

  function handleBillingChange(value: string) {
    setBillingAddressId(value);
    invalidateAttempt();
  }

  async function handleSaveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSavingAddress(true);
      setError(null);
      const savedAddress = await createAddress(newAddress);
      setAddresses((current) => [
        ...current.map((address) => ({
          ...address,
          defaultAddress: savedAddress.defaultAddress
            ? false
            : address.defaultAddress,
        })),
        savedAddress,
      ]);
      setDeliveryAddressId(String(savedAddress.id));
      setAddingAddress(false);
      setNewAddress({
        recipientName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Germany",
        defaultAddress: false,
      });
      invalidateAttempt();
    } catch (saveError) {
      setError(
        errorMessage(saveError, "Your address could not be saved. Please check the details and try again."),
      );
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleReview() {
    setError(null);

    if (mode === "buy-now" && !quantityValid) {
      setError(
        product && Number.isInteger(quantity) && quantity > product.stockQuantity
          ? `Only ${product.stockQuantity} unit(s) are currently available.`
          : "Enter a positive whole-number quantity.",
      );
      return;
    }

    if (!deliveryAddress) {
      setError("Choose a saved delivery address before continuing.");
      return;
    }

    if (billingAddressId && !billingAddress) {
      setError("Choose a saved billing address or use the delivery address.");
      return;
    }

    if (mode === "cart") {
      try {
        const currentItems = await refreshCart();
        if (currentItems.length === 0) {
          setError("Your server cart is empty. Add products before placing this order.");
          return;
        }
      } catch {
        setError("Your cart could not be refreshed. Please retry after checking your connection.");
        return;
      }
    }

    setStage("review");
  }

  async function handlePlaceOrder() {
    if (!deliveryAddress || submittingRef.current) return;
    if (mode === "cart") {
      submittingRef.current = true;
      setCheckingCart(true);
      setSubmitting(true);
      setError(null);
      try {
        const currentItems = await refreshCart();
        if (currentItems.length === 0) {
          setStage("form");
          setError("Your server cart is empty. Add products before placing this order.");
          return;
        }
      } catch {
        setStage("form");
        setError("Your cart could not be refreshed. Please retry before placing your order.");
        return;
      } finally {
        setCheckingCart(false);
        submittingRef.current = false;
        setSubmitting(false);
      }
    }

    const billingRequest = billingAddressId
      ? { billingAddressId: Number(billingAddressId) }
      : {};
    let result: OrderResponse;
    if (mode === "buy-now") {
      if (!product || product.id === null) {
        setError("This product is unavailable. Please choose another product.");
        return;
      }
      const request: BuyNowRequest = {
        productId: product.id,
        quantity,
        addressId: deliveryAddress.id,
        ...billingRequest,
      };
      const key = getAttemptKey(request, attemptFingerprint, attemptKey);
      try {
        submittingRef.current = true;
        setSubmitting(true);
        setError(null);
        result = await buyNow(request, key);
      } catch (requestError) {
        setError(
          errorMessage(
            requestError,
            "We couldn’t place your order. Check your connection and retry. Retrying will safely reuse this checkout attempt.",
          ),
        );
        return;
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    } else {
      const request: OrderRequest = {
        addressId: deliveryAddress.id,
        ...billingRequest,
      };
      const key = getAttemptKey(request, attemptFingerprint, attemptKey);
      try {
        submittingRef.current = true;
        setSubmitting(true);
        setError(null);
        result = await placeCartOrder(request, key);
      } catch (requestError) {
        if (isEmptyCartError(requestError)) {
          setStage("form");
          try {
            const refreshedItems = await refreshCart();
            setError(
              refreshedItems.length === 0
                ? "Your server cart is empty. Add products before placing this order."
                : "The server reported an empty cart. We refreshed the cart; review the current items and try again.",
            );
          } catch {
            setError("The server reported an empty cart, and we could not refresh it. Retry loading your cart before continuing.");
          }
          return;
        }
        setError(
          errorMessage(
            requestError,
            "We couldn’t place your order. Check your connection and retry. Retrying will safely reuse this checkout attempt.",
          ),
        );
        return;
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    }
    setOrder(result);
    setStage("confirmation");
    if (mode === "cart") {
      try {
        await refreshCart();
        setPostOrderCartSyncError(null);
      } catch {
        setPostOrderCartSyncError("Your order was placed, but we couldn’t refresh your cart. Open your cart again to retry.");
      }
    }
  }

  const content = stage === "confirmation" && order ? (
    <section aria-labelledby="order-confirmation-title" className="mx-auto max-w-2xl py-5 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl font-bold text-emerald-900" aria-hidden="true">✓</div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Order placed</p>
      <h2 id="order-confirmation-title" className="mt-2 text-3xl font-black text-slate-950">
        Thank you for your order!
      </h2>
      <p className="mt-3 text-base text-slate-600">Your order number is <strong className="text-emerald-950">#{order.id}</strong></p>
      <ul className="mt-7 divide-y divide-slate-100 rounded-2xl border border-slate-200 text-left">
        {order.items.map((item, index) => (
          <li key={`${item.productId ?? orderItemName(item)}-${index}`} className="flex justify-between gap-4 p-4">
            <span>{orderItemName(item)} × {item.quantity}</span>
            <span className="font-semibold">
              {money.format(item.lineTotal ?? item.total ?? (item.unitPrice ?? item.price ?? 0) * item.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 space-y-3 rounded-2xl bg-[#f7f7f2] p-5 text-left text-base">
        <p><strong>Payment:</strong> Cash on Delivery</p>
        <p><strong>Delivery address:</strong> {addressText(order.deliveryAddress)}</p>
        <p className="flex justify-between border-t border-slate-200 pt-3 text-lg"><strong>Total paid on delivery</strong><strong>{money.format(order.total)}</strong></p>
      </div>
      {postOrderCartSyncError && (
        <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-base text-amber-950">
          {postOrderCartSyncError}
        </p>
      )}
      {onClose && (
        <button type="button" onClick={onClose} className="mt-6 w-full rounded-xl bg-emerald-950 px-5 py-3 font-bold text-white hover:bg-emerald-800">
          Continue shopping
        </button>
      )}
      {!onClose && (
      <Link to="/products" className="mt-6 inline-flex rounded-xl bg-emerald-950 px-5 py-3 font-bold text-white hover:bg-emerald-800">
        Continue shopping
      </Link>
      )}
    </section>
  ) : (
    <div>
      <header className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
            {mode === "cart" ? "Sujus Pickle · Checkout" : "Sujus Pickle · Quick checkout"}
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {stage === "review" ? "Review your order" : mode === "cart" ? "Delivery details" : "Buy now"}
          </h2>
          <p className="mt-2 text-base leading-6 text-slate-600">
            {stage === "review"
              ? "Make sure everything looks right before placing your order."
              : "Choose where you’d like your order delivered."}
          </p>
        </div>
        <CheckoutSteps stage={stage} />
        {onClose && (
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Close checkout" className="absolute right-5 top-5 rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:right-8 sm:top-8">
            <span aria-hidden="true">×</span>
          </button>
        )}
      </header>

      {mode === "cart" && cartStatus === "loading" ? (
        <p role="status" className="mt-6 rounded-xl bg-slate-50 p-5 text-base text-slate-700">
          Refreshing your cart from the server…
        </p>
      ) : mode === "cart" && cartStatus === "error" ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p role="alert" className="text-base text-red-900">{cartError ?? "Your cart could not be loaded."}</p>
          <button
            type="button"
            onClick={() => void refreshCart().catch(() => undefined)}
            className="mt-3 text-base font-bold text-emerald-950 underline"
          >
            Retry loading your cart
          </button>
        </div>
      ) : mode === "cart" && cartStatus === "unauthenticated" ? (
        <p role="alert" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-base text-amber-950">
          Sign in to load and place an order from your cart.
        </p>
      ) : mode === "cart" && checkoutItems.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="text-lg font-bold text-amber-950">Your cart is empty</h3>
          <p className="mt-2 text-base text-amber-900">Add products to your cart before continuing to checkout.</p>
          {error && <p role="alert" className="mt-3 text-base font-semibold text-red-800">{error}</p>}
          <Link to="/products" className="mt-5 inline-flex rounded-xl bg-emerald-950 px-5 py-3 font-bold text-white hover:bg-emerald-800">
            Browse products
          </Link>
        </div>
      ) : loadingAddresses ? (
        <p role="status" className="mt-6 rounded-xl bg-slate-50 p-5 text-base text-slate-700">Loading your saved addresses…</p>
      ) : addressError ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5" role="alert">
          <p className="text-base text-red-800">{addressError}</p>
          <button type="button" onClick={() => setAddressLoadAttempt((attempt) => attempt + 1)} className="mt-3 text-base font-semibold text-emerald-900 underline">
            Try loading addresses again
          </button>
        </div>
      ) : stage === "form" ? (
        <div className="mt-7 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.72fr)] lg:gap-10">
          <div className="space-y-7">
            {addresses.length === 0 && (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-base text-amber-950">
                You don’t have a saved address yet. Add one below to continue.
              </p>
            )}
            {mode === "buy-now" && product && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <SectionHeading number="01" title="Item quantity" subtitle="Confirm how many jars you’d like." />
                <label className="mt-5 block max-w-xs">
                  <span className="mb-2 block text-base font-semibold text-slate-800">Quantity</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={quantityInput}
                    onChange={(event) => handleQuantityChange(event.target.value)}
                    aria-invalid={quantityInput.length > 0 && !quantityValid}
                    aria-describedby="buy-now-quantity-hint"
                    className="min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  />
                  <span id="buy-now-quantity-hint" className="mt-2 block text-sm text-slate-500">{product.stockQuantity} available</span>
                </label>
              </section>
            )}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <SectionHeading number={mode === "buy-now" ? "02" : "01"} title="Delivery address" subtitle="Choose a saved address or add a new one." />
              <div className="mt-5">
                <AddressSelect
                  id="delivery-address"
                  label="Delivery address"
                  value={deliveryAddressId}
                  addresses={addresses}
                  loading={loadingAddresses}
                  submitting={submitting}
                  onChange={handleDeliveryChange}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddingAddress((current) => !current);
                  setError(null);
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-lg py-1 text-base font-bold text-emerald-900 underline decoration-2 underline-offset-4 hover:text-emerald-700"
              >
                {addingAddress ? "Choose a saved address instead" : "＋ Add a new delivery address"}
              </button>
              {addingAddress && (
                <form
                  onSubmit={(event) => void handleSaveAddress(event)}
                  className="mt-4 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 sm:p-6"
                  aria-label="Add delivery address"
                >
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">New delivery address</h3>
                    <p className="mt-1 text-base text-slate-600">Add an address to your saved addresses and use it for this order.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AddressField label="Recipient name" value={newAddress.recipientName} autoComplete="name" required onChange={(value) => setNewAddress({ ...newAddress, recipientName: value })} />
                    <AddressField label="Phone number" value={newAddress.phone} type="tel" autoComplete="tel" required onChange={(value) => setNewAddress({ ...newAddress, phone: value })} />
                    <div className="sm:col-span-2">
                      <AddressField label="Address line 1" value={newAddress.addressLine1} autoComplete="address-line1" required onChange={(value) => setNewAddress({ ...newAddress, addressLine1: value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <AddressField label="Address line 2" value={newAddress.addressLine2} autoComplete="address-line2" onChange={(value) => setNewAddress({ ...newAddress, addressLine2: value })} />
                    </div>
                    <AddressField label="City" value={newAddress.city} autoComplete="address-level2" required onChange={(value) => setNewAddress({ ...newAddress, city: value })} />
                    <AddressField label="State / region" value={newAddress.state} autoComplete="address-level1" onChange={(value) => setNewAddress({ ...newAddress, state: value })} />
                    <AddressField label="Postal code" value={newAddress.postalCode} autoComplete="postal-code" required onChange={(value) => setNewAddress({ ...newAddress, postalCode: value })} />
                    <AddressField label="Country" value={newAddress.country} autoComplete="country-name" required onChange={(value) => setNewAddress({ ...newAddress, country: value })} />
                  </div>
                  <label className="flex items-center gap-3 py-1 text-base font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={newAddress.defaultAddress}
                      onChange={(event) => setNewAddress({ ...newAddress, defaultAddress: event.target.checked })}
                      className="h-5 w-5 rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
                    />
                    Save as my default address
                  </label>
                  <button type="submit" disabled={savingAddress} className="w-full rounded-xl bg-emerald-900 px-5 py-3 text-base font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                    {savingAddress ? "Saving address…" : "Save and use this address"}
                  </button>
                </form>
              )}
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <SectionHeading number={mode === "buy-now" ? "03" : "02"} title="Billing address" subtitle="Your invoice will use this address." />
              <div className="mt-5">
                <AddressSelect
                  id="billing-address"
                  label="Bill to"
                  value={billingAddressId}
                  addresses={addresses}
                  loading={loadingAddresses}
                  submitting={submitting}
                  optional
                  onChange={handleBillingChange}
                />
              </div>
            </section>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-base text-red-800">{error}</p>}
            {addresses.length === 0 && !addingAddress && (
              <Link to="/profile" className="block text-base font-semibold text-emerald-900 underline">Manage saved addresses</Link>
            )}
            <button
              type="button"
              onClick={() => void handleReview()}
              disabled={loadingAddresses || addresses.length === 0 || addingAddress || (mode === "cart" && cartStatus !== "ready")}
              className="w-full rounded-xl bg-emerald-950 px-5 py-4 text-base font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to order review <span aria-hidden="true">→</span>
            </button>
          </div>
          <aside className="lg:sticky lg:top-28">
            <OrderSummary items={checkoutItems} subtotal={subtotal} deliveryAddress={deliveryAddress} billingAddress={billingAddress} />
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-5 text-emerald-950">
              <span aria-hidden="true" className="text-lg">✓</span>
              <p>Secure checkout. You’ll pay <strong>Cash on Delivery</strong> when your order arrives.</p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="mt-7 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.72fr)] lg:gap-10">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <SectionHeading number="01" title="Delivery address" subtitle="Your order will be sent to this saved address." />
              <p className="mt-4 text-base leading-7 text-slate-700">{deliveryAddress ? addressText(deliveryAddress) : ""}</p>
              {billingAddressId && billingAddress && <p className="mt-4 border-t border-slate-100 pt-4 text-base leading-7 text-slate-700"><strong>Billing address:</strong> {addressText(billingAddress)}</p>}
              <button type="button" onClick={() => { setStage("form"); setError(null); }} className="mt-4 text-sm font-semibold text-emerald-900 underline">Edit addresses</button>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <SectionHeading number="02" title="Payment method" subtitle="Simple, secure payment when your order arrives." />
              <div className="mt-4 flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl text-emerald-900" aria-hidden="true">₹</span>
                <span><strong className="block text-base text-slate-900">Cash on Delivery</strong><span className="mt-1 block text-sm text-slate-600">Pay in cash when your order is delivered.</span></span>
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-emerald-800 text-xs text-white" aria-label="Selected">✓</span>
              </div>
            </section>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-base text-red-800">{error}</p>}
            {submitting && <p role="status" className="text-base font-semibold text-emerald-900">Placing your order…</p>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button type="button" disabled={submitting} onClick={() => { setStage("form"); setError(null); }} className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                ← Back to delivery
              </button>
              <button type="button" disabled={submitting} onClick={() => void handlePlaceOrder()} className="flex-1 rounded-xl bg-emerald-950 px-5 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50">
                {submitting ? checkingCart ? "Checking cart…" : "Placing order…" : "Place order"}
              </button>
            </div>
          </div>
          <aside className="lg:sticky lg:top-28">
            <OrderSummary items={checkoutItems} subtotal={subtotal} deliveryAddress={deliveryAddress} billingAddress={billingAddress} />
          </aside>
        </div>
      )}
    </div>
  );

  return onClose ? (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-5" role="presentation">
      <section role="dialog" aria-modal="true" aria-label={mode === "cart" ? "Checkout" : "Buy now checkout"} className="relative max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-8">
        {content}
      </section>
    </div>
  ) : (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-35px_rgba(15,23,42,0.35)] sm:p-8 lg:p-10">
      {content}
    </section>
  );
}

function CheckoutSteps({ stage }: { stage: "form" | "review" | "confirmation" }) {
  const current = stage === "form" ? 1 : stage === "review" ? 2 : 3;
  const steps = ["Delivery", "Review", "Confirmation"];
  return (
    <nav aria-label="Checkout progress" className="w-full sm:max-w-sm">
      <ol className="grid grid-cols-3">
        {steps.map((label, index) => {
          const number = index + 1;
          const complete = number < current;
          const active = number === current;
          return (
            <li key={label} aria-current={active ? "step" : undefined} className="relative flex flex-col items-center text-center">
              {index < steps.length - 1 && <span className={`absolute left-1/2 top-4 h-px w-full ${complete ? "bg-emerald-700" : "bg-slate-200"}`} aria-hidden="true" />}
              <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${complete || active ? "border-emerald-800 bg-emerald-800 text-white" : "border-slate-300 bg-white text-slate-500"}`}>
                {complete ? "✓" : number}
              </span>
              <span className={`mt-2 text-xs font-semibold sm:text-sm ${active ? "text-emerald-950" : "text-slate-500"}`}>{label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function SectionHeading({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">{number}</span>
      <div>
        <h3 className="text-lg font-bold tracking-tight text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function getAttemptKey(
  request: OrderRequest | BuyNowRequest,
  fingerprint: { current: string | null },
  key: { current: string | null },
) {
  const nextFingerprint = JSON.stringify(request);
  if (fingerprint.current !== nextFingerprint || !key.current) {
    fingerprint.current = nextFingerprint;
    key.current = globalThis.crypto.randomUUID();
  }
  return key.current;
}

function AddressSelect({
  id,
  label,
  value,
  addresses,
  loading,
  submitting,
  optional = false,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  addresses: Address[];
  loading: boolean;
  submitting: boolean;
  optional?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-base font-semibold text-slate-800">
        {label}{optional ? " (optional)" : ""}
      </span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={loading || addresses.length === 0 || submitting}
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100"
      >
        {optional && <option value="">Same as delivery address</option>}
        {!optional && <option value="">Select a saved address</option>}
        {addresses.map((address) => (
          <option key={address.id} value={address.id}>
            {address.recipientName} — {address.addressLine1}, {address.city}
            {address.defaultAddress ? " (Default)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function AddressField({
  label,
  value,
  type = "text",
  autoComplete,
  required = false,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-base font-semibold text-slate-800">
        {label}{required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function OrderSummary({
  items,
  subtotal,
  deliveryAddress,
  billingAddress,
}: {
  items: CheckoutLine[];
  subtotal: number;
  deliveryAddress?: Address;
  billingAddress?: Address;
}) {
  return (
    <section aria-label="Order summary" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <h3 className="font-bold text-slate-950">Order summary</h3>
      <ul className="mt-3 space-y-2">
        {items.map(({ product, quantity }) => (
          <li key={product.id} className="flex justify-between gap-3 text-base text-slate-700">
            <span>{product.name} × {quantity}</span>
            <span>{money.format(Math.round(product.price * 100) * quantity / 100)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 text-base">
        <p className="flex justify-between gap-4"><span>Subtotal</span><span>{money.format(subtotal)}</span></p>
        <p className="flex justify-between gap-4"><span>Delivery charge</span><span>{money.format(0)}</span></p>
        <p className="flex justify-between gap-4"><span>Tax</span><span>{money.format(0)}</span></p>
        <p className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-lg font-black text-emerald-950"><span>Total</span><span>{money.format(subtotal)}</span></p>
      </div>
      {deliveryAddress && (
        <p className="mt-4 text-sm leading-6 text-slate-600"><strong>Delivering to:</strong> {addressText(deliveryAddress)}</p>
      )}
      {billingAddress && deliveryAddress && billingAddress.id !== deliveryAddress.id && (
        <p className="mt-2 text-sm leading-6 text-slate-600"><strong>Billing address:</strong> {addressText(billingAddress)}</p>
      )}
      <p className="mt-4 rounded-lg bg-amber-50 px-3 py-3 text-base font-semibold text-amber-950">Payment method: Cash on Delivery</p>
    </section>
  );
}
