import { apiClient } from "./apiClient";
import type { Product } from "../types/Product";

export async function getProducts(): Promise<Product[]> {
  const response = await apiClient.get<Product[]>("/products");
  return response.data;
}

export async function getProduct(
  productId: number
): Promise<Product> {
  const response = await apiClient.get<Product>(
    `/products/${productId}`
  );

  return response.data;
}