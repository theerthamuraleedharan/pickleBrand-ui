import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "./apiClient";
import { buyNow, placeCartOrder, type OrderResponse } from "./orderApi";

vi.mock("./apiClient", () => ({
  apiClient: { post: vi.fn() },
}));

const order = { id: 42 } as OrderResponse;

beforeEach(() => {
  vi.mocked(apiClient.post).mockResolvedValue({ data: order });
});

describe("order API", () => {
  it("posts Buy Now orders with product, quantity and the idempotency key", async () => {
    const request = { productId: 7, quantity: 2, addressId: 10, billingAddressId: 11 };

    await expect(buyNow(request, "buy-now-key")).resolves.toBe(order);

    expect(apiClient.post).toHaveBeenCalledWith(
      "/orders/buy-now",
      request,
      { headers: { "Idempotency-Key": "buy-now-key" } },
    );
  });

  it("posts cart orders with the saved address and the idempotency key", async () => {
    const request = { addressId: 10 };

    await expect(placeCartOrder(request, "cart-order-key")).resolves.toBe(order);

    expect(apiClient.post).toHaveBeenCalledWith(
      "/orders",
      request,
      { headers: { "Idempotency-Key": "cart-order-key" } },
    );
  });
});
