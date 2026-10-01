// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState, type PropsWithChildren } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";

import { buyNow, placeCartOrder, type OrderResponse } from "../../api/orderApi";
import { createAddress, getAddresses } from "../../api/profileApi";
import { CartContext, type CartContextValue } from "../../contexts/cartContext";
import type { Address } from "../../types/Profile";
import type { Product } from "../../types/Product";
import { ProductCard } from "../ProductCard";
import { CheckoutPanel } from "./CheckoutPanel";

vi.mock("../../api/orderApi", () => ({
  buyNow: vi.fn(),
  placeCartOrder: vi.fn(),
}));

vi.mock("../../api/profileApi", () => ({
  createAddress: vi.fn(),
  getAddresses: vi.fn(),
}));

const addresses: Address[] = [
  {
    id: 10,
    recipientName: "Asha Customer",
    phone: "1234567890",
    addressLine1: "12 Pickle Lane",
    addressLine2: null,
    city: "Mysuru",
    state: "Karnataka",
    postalCode: "570001",
    country: "India",
    defaultAddress: true,
  },
  {
    id: 11,
    recipientName: "Asha Customer",
    phone: "1234567890",
    addressLine1: "8 Garden Road",
    addressLine2: null,
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    country: "India",
    defaultAddress: false,
  },
];

const product: Product = {
  id: 7,
  name: "Mango Pickle",
  description: "Traditional mango pickle",
  price: 250,
  stockQuantity: 5,
  weightGrams: 500,
  spiceLevel: "MEDIUM",
  imageUrl: null,
  active: true,
  category: "VEG",
  imageName: null,
};

const order: OrderResponse = {
  id: 321,
  status: "PLACED",
  paymentStatus: "UNPAID",
  paymentMethod: "CASH_ON_DELIVERY",
  items: [{ productId: 7, productName: "Mango Pickle", quantity: 2, unitPrice: 250, lineTotal: 500 }],
  deliveryAddress: addresses[0],
  billingAddress: addresses[0],
  subtotal: 500,
  deliveryCharge: 0,
  tax: 0,
  total: 500,
};
const serverCart = [{ product, quantity: 2 }];

const clearCart = vi.fn();
const addItem = vi.fn();
const refreshCart = vi.fn();
const cartContext: CartContextValue = {
  items: [{ product, quantity: 2 }],
  itemCount: 2,
  subtotal: 500,
  storageError: false,
  cartStatus: "ready",
  cartError: null,
  refreshCart,
  addItem,
  setQuantity: vi.fn(),
  removeItem: vi.fn(),
  clearCart,
};

function CheckoutCartHarness({
  children,
  initialItems = cartContext.items,
  status = "ready",
  error = null,
}: PropsWithChildren<{
  initialItems?: CartContextValue["items"];
  status?: CartContextValue["cartStatus"];
  error?: string | null;
}>) {
  const [serverItems, setServerItems] = useState(initialItems);
  const contextValue: CartContextValue = {
    ...cartContext,
    items: serverItems,
    itemCount: serverItems.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: serverItems.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
    cartStatus: status,
    cartError: error,
    refreshCart: async () => {
      const result = await refreshCart();
      setServerItems(result);
      return result;
    },
  };
  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
}

function renderCheckout(
  mode: "cart" | "buy-now",
  cartOptions?: {
    initialItems?: CartContextValue["items"];
    status?: CartContextValue["cartStatus"];
    error?: string | null;
  },
) {
  return render(
    <MemoryRouter>
      <CheckoutCartHarness {...cartOptions}>
        <CheckoutPanel
          mode={mode}
          items={[{ product, quantity: mode === "cart" ? 2 : 1 }]}
          onClose={mode === "buy-now" ? vi.fn() : undefined}
        />
      </CheckoutCartHarness>
    </MemoryRouter>,
  );
}

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

beforeEach(() => {
  vi.mocked(getAddresses).mockResolvedValue(addresses);
  vi.mocked(createAddress).mockResolvedValue(addresses[1]);
  vi.mocked(buyNow).mockResolvedValue(order);
  vi.mocked(placeCartOrder).mockResolvedValue(order);
  clearCart.mockClear();
  addItem.mockClear();
  refreshCart.mockResolvedValue([{ product, quantity: 2 }]);
  vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("00000000-0000-4000-8000-000000000001");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CheckoutPanel", () => {
  it("validates Buy Now quantity and confirms a successful order without changing the cart", async () => {
    renderCheckout("buy-now");
    await screen.findByLabelText("Delivery address");

    fireEvent.change(screen.getByLabelText("Delivery address"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue to order review/ }));
    expect((await screen.findByRole("alert")).textContent).toContain("Choose a saved delivery address");
    fireEvent.change(screen.getByLabelText("Delivery address"), { target: { value: "10" } });

    fireEvent.change(screen.getByLabelText(/Quantity/), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue to order review/ }));
    expect((await screen.findByRole("alert")).textContent).toContain("positive whole-number quantity");
    expect(buyNow).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Quantity/), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue to order review/ }));
    expect((await screen.findByRole("alert")).textContent).toContain("Only 5 unit(s)");

    fireEvent.change(screen.getByLabelText(/Quantity/), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Bill to (optional)"), { target: { value: "11" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue to order review/ }));
    expect(screen.getAllByText(/12 Pickle Lane/).some((node) => node.textContent?.includes("Delivering to:"))).toBe(true);
    expect(screen.getAllByText(/8 Garden Road/).some((node) => node.textContent?.includes("Billing address:"))).toBe(true);
    expect(screen.getByText("Total").textContent).toBe("Total");

    fireEvent.click(screen.getByRole("button", { name: "Place order" }));
    expect((await screen.findByText(/Your order number is/)).textContent).toContain("#321");
    expect(screen.getByText("Cash on Delivery")).toBeTruthy();
    expect(screen.getAllByText(/12 Pickle Lane/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Mango Pickle × 2/)).toBeTruthy();
    expect(screen.getAllByText("₹500.00")).toHaveLength(2);
    expect(buyNow).toHaveBeenCalledWith(
      { productId: 7, quantity: 2, addressId: 10, billingAddressId: 11 },
      "00000000-0000-4000-8000-000000000001",
    );
    expect(clearCart).not.toHaveBeenCalled();
  });

  it("reuses the same idempotency key when retrying a failed cart checkout", async () => {
    vi.mocked(placeCartOrder)
      .mockRejectedValueOnce(new Error("network disconnected"))
      .mockResolvedValueOnce(order);
    renderCheckout("cart");
    await screen.findByLabelText("Delivery address");

    expect(screen.getByText("Delivery charge")).toBeTruthy();
    expect(screen.getByText("Tax")).toBeTruthy();
    expect(screen.getByText(/Payment method: Cash on Delivery/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Continue to order review/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Place order" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Check your connection and retry");
    fireEvent.click(screen.getByRole("button", { name: "Place order" }));

    await screen.findByText(/Your order number is/);
    await waitFor(() => expect(placeCartOrder).toHaveBeenCalledTimes(2));
    expect(vi.mocked(placeCartOrder).mock.calls[0][0]).toEqual({ addressId: 10 });
    expect(vi.mocked(placeCartOrder).mock.calls[0][1]).toBe("00000000-0000-4000-8000-000000000001");
    expect(vi.mocked(placeCartOrder).mock.calls[1][1]).toBe("00000000-0000-4000-8000-000000000001");
    expect(refreshCart).toHaveBeenCalledTimes(4);
    expect(clearCart).not.toHaveBeenCalled();
  });

  it("shows the API stock conflict message and prevents duplicate submission in flight", async () => {
    let finishRequest: ((value: OrderResponse) => void) | undefined;
    let finishRefresh: ((value: typeof serverCart) => void) | undefined;
    vi.mocked(placeCartOrder).mockImplementation(
      () => new Promise((resolve) => { finishRequest = resolve; }),
    );
    refreshCart
      .mockResolvedValueOnce(serverCart)
      .mockImplementationOnce(
      () => new Promise((resolve) => { finishRefresh = resolve; }),
      );
    renderCheckout("cart");
    await screen.findByLabelText("Delivery address");
    fireEvent.click(screen.getByRole("button", { name: /Continue to order review/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Place order" }));

    const checking = await screen.findByRole("button", { name: "Checking cart…" });
    expect((checking as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(checking);
    expect(placeCartOrder).not.toHaveBeenCalled();
    finishRefresh?.(serverCart);
    const placing = await screen.findByRole("button", { name: "Placing order…" });
    expect((placing as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(placing);
    expect(placeCartOrder).toHaveBeenCalledTimes(1);
    finishRequest?.(order);
    expect(await screen.findByText(/Your order number is/)).toBeTruthy();
    expect(placeCartOrder).toHaveBeenCalledTimes(1);
  });

  it("explains that the requested stock is no longer available", async () => {
    const conflict = Object.assign(new Error("conflict"), {
      isAxiosError: true,
      response: { status: 409, data: {} },
    });
    vi.mocked(placeCartOrder).mockRejectedValueOnce(conflict);
    renderCheckout("cart");
    await screen.findByLabelText("Delivery address");
    fireEvent.click(screen.getByRole("button", { name: /Continue to order review/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Place order" }));

    expect((await screen.findByRole("alert")).textContent).toContain("no longer available");
  });

  it("asks customers to sign in again when the server rejects authentication", async () => {
    const unauthorized = Object.assign(new Error("unauthorized"), {
      isAxiosError: true,
      response: { status: 401, data: {} },
    });
    vi.mocked(placeCartOrder).mockRejectedValueOnce(unauthorized);
    renderCheckout("cart");
    await screen.findByLabelText("Delivery address");
    fireEvent.click(screen.getByRole("button", { name: /Continue to order review/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Place order" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Please sign in again");
  });

  it("navigates to the dedicated Buy Now checkout page without adding to the cart", async () => {
    render(
      <MemoryRouter>
        <CartContext.Provider value={cartContext}>
          <>
            <ProductCard product={product} />
            <CurrentPath />
          </>
        </CartContext.Provider>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Buy Now" }));

    await waitFor(() => expect(screen.getByTestId("current-path").textContent).toBe("/checkout/buy-now/7"));
    expect(addItem).not.toHaveBeenCalled();
  });

  it("allows a customer with no saved addresses to enter and save a delivery address", async () => {
    vi.mocked(getAddresses).mockResolvedValueOnce([]);
    renderCheckout("cart");
    expect(await screen.findByText(/You don’t have a saved address yet/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Add a new delivery address/ }));

    expect(screen.getByRole("form", { name: "Add delivery address" })).toBeTruthy();
    expect((screen.getByLabelText("Recipient name *") as HTMLInputElement).className).toContain("text-base");
    fireEvent.change(screen.getByLabelText("Recipient name *"), { target: { value: "Asha Customer" } });
    fireEvent.change(screen.getByLabelText("Phone number *"), { target: { value: "1234567890" } });
    fireEvent.change(screen.getByLabelText("Address line 1 *"), { target: { value: "8 Garden Road" } });
    fireEvent.change(screen.getByLabelText("City *"), { target: { value: "Bengaluru" } });
    fireEvent.change(screen.getByLabelText("Postal code *"), { target: { value: "560001" } });
    fireEvent.change(screen.getByLabelText("Country *"), { target: { value: "India" } });
    fireEvent.click(screen.getByRole("button", { name: "Save and use this address" }));

    await waitFor(() => expect(createAddress).toHaveBeenCalledWith({
      recipientName: "Asha Customer",
      phone: "1234567890",
      addressLine1: "8 Garden Road",
      addressLine2: "",
      city: "Bengaluru",
      state: "",
      postalCode: "560001",
      country: "India",
      defaultAddress: false,
    }));
    expect((screen.getByLabelText("Delivery address") as HTMLSelectElement).value).toBe("11");
  });

  it("shows an empty-cart state and removes the stale item summary after server refresh", async () => {
    refreshCart.mockResolvedValueOnce([]);
    renderCheckout("cart");
    await screen.findByLabelText("Delivery address");
    expect(screen.getByText("Mango Pickle × 2")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Continue to order review/ }));

    expect(await screen.findByText("Your cart is empty")).toBeTruthy();
    expect(screen.queryByText("Mango Pickle × 2")).toBeNull();
    expect(screen.queryByRole("button", { name: "Place order" })).toBeNull();
    expect(placeCartOrder).not.toHaveBeenCalled();
  });

  it("refreshes the visible cart when order placement returns an empty-cart error", async () => {
    const emptyCartError = Object.assign(new Error("Cart is empty"), {
      isAxiosError: true,
      response: { status: 400, data: { message: "Cart is empty" } },
    });
    vi.mocked(placeCartOrder).mockRejectedValueOnce(emptyCartError);
    refreshCart
      .mockResolvedValueOnce(serverCart)
      .mockResolvedValueOnce(serverCart)
      .mockResolvedValueOnce([]);
    renderCheckout("cart");
    await screen.findByLabelText("Delivery address");
    fireEvent.click(screen.getByRole("button", { name: /Continue to order review/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Place order" }));

    expect(await screen.findByText("Your cart is empty")).toBeTruthy();
    expect(screen.queryByText("Mango Pickle × 2")).toBeNull();
    expect((screen.getByRole("alert").textContent ?? "")).toContain("server cart is empty");
    expect(placeCartOrder).toHaveBeenCalledTimes(1);
  });

  it("does not show the cached product summary while the server cart is loading or failed", async () => {
    const { rerender } = renderCheckout("cart", { status: "loading" });
    expect(screen.getByRole("status").textContent).toContain("Refreshing your cart");
    expect(screen.queryByText("Mango Pickle × 2")).toBeNull();

    rerender(
      <MemoryRouter>
        <CheckoutCartHarness status="error" error="Server cart request failed">
          <CheckoutPanel mode="cart" items={[{ product, quantity: 2 }]} />
        </CheckoutCartHarness>
      </MemoryRouter>,
    );
    expect((await screen.findByRole("alert")).textContent).toContain("Server cart request failed");
    expect(screen.queryByText("Mango Pickle × 2")).toBeNull();
  });
});
