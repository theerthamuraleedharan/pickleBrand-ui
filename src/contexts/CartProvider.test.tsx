// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { addCartItem, deleteCartItem, getCart, setCartItemQuantity } from "../api/cartApi";
import type { Product } from "../types/Product";
import { CartProvider } from "./CartProvider";
import { useCart } from "./cartContext";

vi.mock("../api/cartApi", () => ({
  addCartItem: vi.fn(),
  deleteCartItem: vi.fn(),
  getCart: vi.fn(),
  setCartItemQuantity: vi.fn(),
}));

vi.mock("./AuthContext", () => ({
  useAuth: () => ({ authenticated: true, user: { id: 55 } }),
}));

const product: Product = {
  id: 7,
  name: "Mango Pickle",
  description: "Traditional pickle",
  price: 250,
  stockQuantity: 5,
  weightGrams: 500,
  spiceLevel: "MEDIUM",
  imageUrl: null,
  active: true,
  category: "VEG",
  imageName: null,
};
const serverCart = [{ product, quantity: 2 }];

function CartProbe() {
  const cart = useCart();
  return (
    <div>
      <p>{cart.cartStatus}</p>
      {cart.cartError && <p role="alert">{cart.cartError}</p>}
      <ul>{cart.items.map(({ product: lineProduct, quantity }) => (
        <li key={lineProduct.id}>{lineProduct.name} × {quantity}</li>
      ))}</ul>
      <button onClick={() => void cart.addItem(product).catch(() => undefined)}>Add</button>
      <button onClick={() => void cart.setQuantity(7, 3).catch(() => undefined)}>Update</button>
      <button onClick={() => void cart.removeItem(7).catch(() => undefined)}>Remove</button>
      <button onClick={() => void cart.refreshCart().catch(() => undefined)}>Refresh</button>
    </div>
  );
}

function renderCart() {
  return render(<CartProvider><CartProbe /></CartProvider>);
}

beforeEach(() => {
  localStorage.clear();
  vi.mocked(getCart).mockResolvedValue(serverCart);
  vi.mocked(addCartItem).mockResolvedValue();
  vi.mocked(setCartItemQuantity).mockResolvedValue();
  vi.mocked(deleteCartItem).mockResolvedValue();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CartProvider server synchronization", () => {
  it("loads from the authenticated server and synchronizes add, update, and remove mutations", async () => {
    localStorage.setItem("sujus-cart:55", JSON.stringify([{ product, quantity: 4 }]));
    renderCart();
    expect(await screen.findByText("Mango Pickle × 2")).toBeTruthy();
    expect(screen.queryByText("Mango Pickle × 4")).toBeNull();
    expect(getCart).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(addCartItem).toHaveBeenCalledWith({ productId: 7, quantity: 1 }));
    await waitFor(() => expect(getCart).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => expect(setCartItemQuantity).toHaveBeenCalledWith(7, 3));
    await waitFor(() => expect(getCart).toHaveBeenCalledTimes(3));

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(deleteCartItem).toHaveBeenCalledWith(7));
    await waitFor(() => expect(getCart).toHaveBeenCalledTimes(4));
  });

  it("shows a loading state until the server cart request settles", async () => {
    let resolveCart: ((items: typeof serverCart) => void) | undefined;
    vi.mocked(getCart).mockImplementation(
      () => new Promise((resolve) => { resolveCart = resolve; }),
    );
    renderCart();

    expect(screen.getByText("loading")).toBeTruthy();
    expect(screen.queryByText("Mango Pickle × 2")).toBeNull();
    resolveCart?.(serverCart);
    expect(await screen.findByText("Mango Pickle × 2")).toBeTruthy();
  });

  it("shows a cart API error rather than treating a failed request as an empty cart", async () => {
    vi.mocked(getCart).mockRejectedValueOnce(new Error("network unavailable"));
    renderCart();

    expect((await screen.findByRole("alert")).textContent).toContain("could not be synchronized");
    expect(screen.getByText("error")).toBeTruthy();
    expect(screen.queryByText("Mango Pickle × 2")).toBeNull();
  });

  it("does not treat a failed add request as persisted", async () => {
    vi.mocked(addCartItem).mockRejectedValueOnce(new Error("add failed"));
    renderCart();
    await screen.findByText("Mango Pickle × 2");

    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("Your cart could not be synchronized. Please try again.")).toBeTruthy();
    expect(getCart).toHaveBeenCalledTimes(1);
  });
});
