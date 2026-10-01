import { apiClient } from "./apiClient";
import { getProduct } from "./productApi";
import type { CartItem } from "../contexts/cartContext";
import type { Product } from "../types/Product";

interface AddCartItemRequest {
  productId: number;
  quantity: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProduct(value: unknown): value is Product {
  if (!isRecord(value)) return false;
  return (
    (typeof value.id === "number" || value.id === null) &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.price === "number" &&
    typeof value.stockQuantity === "number" &&
    typeof value.weightGrams === "number" &&
    typeof value.spiceLevel === "string" &&
    (typeof value.imageUrl === "string" || value.imageUrl === null) &&
    typeof value.active === "boolean" &&
    typeof value.category === "string" &&
    (typeof value.imageName === "string" || value.imageName === null)
  );
}

function extractCartItems(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) {
    throw new Error("The server returned an invalid cart response.");
  }

  const payload = isRecord(data.cart) ? data.cart : data;
  const items = payload.items ?? payload.cartItems;
  if (!Array.isArray(items)) {
    throw new Error("The server returned an invalid cart response.");
  }

  return items;
}

async function hydrateCartItems(data: unknown): Promise<CartItem[]> {
  const rawItems = extractCartItems(data);
  return Promise.all(
    rawItems.map(async (rawItem): Promise<CartItem> => {
      if (!isRecord(rawItem) || !Number.isInteger(rawItem.quantity) || Number(rawItem.quantity) < 1) {
        throw new Error("The server returned an invalid cart item.");
      }

      const quantity = Number(rawItem.quantity);
      if (isProduct(rawItem.product) && Number.isInteger(rawItem.product.id)) {
        return { product: rawItem.product, quantity };
      }

      const productId =
        typeof rawItem.productId === "number"
          ? rawItem.productId
          : isRecord(rawItem.product) && typeof rawItem.product.id === "number"
            ? rawItem.product.id
            : null;
      if (productId === null || !Number.isInteger(productId)) {
        throw new Error("The server returned a cart item without a product.");
      }

      return { product: await getProduct(productId), quantity };
    }),
  );
}

export async function getCart(): Promise<CartItem[]> {
  const response = await apiClient.get<unknown>("/cart");
  return hydrateCartItems(response.data);
}

export async function addCartItem(
  request: AddCartItemRequest,
): Promise<void> {
  await apiClient.post("/cart/items", request);
}

export async function setCartItemQuantity(
  productId: number,
  quantity: number,
): Promise<void> {
  await apiClient.put(`/cart/items/${productId}`, { quantity });
}

export async function deleteCartItem(productId: number): Promise<void> {
  await apiClient.delete(`/cart/items/${productId}`);
}
