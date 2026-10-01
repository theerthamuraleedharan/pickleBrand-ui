import { apiClient } from "./apiClient";
import type { Address } from "../types/Profile";
import type { Product } from "../types/Product";

export interface OrderRequest {
  addressId: number;
  billingAddressId?: number;
}

export interface BuyNowRequest extends OrderRequest {
  productId: number;
  quantity: number;
}

export interface OrderItemSnapshot {
  productId?: number;
  productName?: string;
  name?: string;
  product?: Pick<Product, "name">;
  quantity: number;
  unitPrice?: number;
  price?: number;
  lineTotal?: number;
  total?: number;
}

export interface OrderResponse {
  id: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  items: OrderItemSnapshot[];
  deliveryAddress: Address;
  billingAddress: Address;
  subtotal: number;
  deliveryCharge: number;
  tax: number;
  total: number;
}

export async function placeCartOrder(
  request: OrderRequest,
  idempotencyKey: string,
): Promise<OrderResponse> {
  const response = await apiClient.post<OrderResponse>(
    "/orders",
    request,
    { headers: { "Idempotency-Key": idempotencyKey } },
  );

  return response.data;
}

export async function buyNow(
  request: BuyNowRequest,
  idempotencyKey: string,
): Promise<OrderResponse> {
  const response = await apiClient.post<OrderResponse>(
    "/orders/buy-now",
    request,
    { headers: { "Idempotency-Key": idempotencyKey } },
  );

  return response.data;
}
