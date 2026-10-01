import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "./apiClient";
import { addCartItem, deleteCartItem, getCart, setCartItemQuantity } from "./cartApi";

vi.mock("./apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("./productApi", () => ({
  getProduct: vi.fn(),
}));

const product = {
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
} as const;

beforeEach(() => vi.clearAllMocks());

describe("server cart API", () => {
  it("loads server cart items as checkout-ready cart lines", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { items: [{ product, quantity: 2 }] },
    });

    await expect(getCart()).resolves.toEqual([{ product, quantity: 2 }]);
    expect(apiClient.get).toHaveBeenCalledWith("/cart");
  });

  it("uses the shared authenticated API client for add, quantity update, and remove", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({});
    vi.mocked(apiClient.put).mockResolvedValue({});
    vi.mocked(apiClient.delete).mockResolvedValue({});

    await addCartItem({ productId: 7, quantity: 1 });
    await setCartItemQuantity(7, 3);
    await deleteCartItem(7);

    expect(apiClient.post).toHaveBeenCalledWith("/cart/items", { productId: 7, quantity: 1 });
    expect(apiClient.put).toHaveBeenCalledWith("/cart/items/7", { quantity: 3 });
    expect(apiClient.delete).toHaveBeenCalledWith("/cart/items/7");
  });

  it("rejects malformed responses instead of reporting an empty cart", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { products: [] } });

    await expect(getCart()).rejects.toThrow("invalid cart response");
  });
});
