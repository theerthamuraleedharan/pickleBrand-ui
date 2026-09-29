import { apiClient } from "./apiClient";

import type {
  AdminProduct,
  AdminProductRequest,
} from "../types/AdminProduct";

function createProductFormData(
  request: AdminProductRequest,
  photo?: File | null
): FormData {
  const formData = new FormData();

  const productJson = new Blob(
    [JSON.stringify(request)],
    {
      type: "application/json",
    }
  );

  formData.append(
    "product",
    productJson
  );

  if (photo) {
    formData.append(
      "photo",
      photo
    );
  }

  return formData;
}

export async function getAdminProducts():
Promise<AdminProduct[]> {

  const response =
    await apiClient.get<AdminProduct[]>(
      "/admin/products"
    );

  return response.data;
}

export async function getAdminProduct(
  productId: number
): Promise<AdminProduct> {

  const response =
    await apiClient.get<AdminProduct>(
      `/admin/products/${productId}`
    );

  return response.data;
}

export async function createAdminProduct(
  request: AdminProductRequest,
  photo?: File | null
): Promise<AdminProduct> {

  const formData =
    createProductFormData(
      request,
      photo
    );

  const response =
    await apiClient.post<AdminProduct>(
      "/admin/products",
      formData
    );
   console.log("response.data", response.data);
  return response.data;
}

export async function updateAdminProduct(
  productId: number,
  request: AdminProductRequest,
  photo?: File | null
): Promise<AdminProduct> {

  const formData =
    createProductFormData(
      request,
      photo
    );

  const response =
    await apiClient.put<AdminProduct>(
      `/admin/products/${productId}`,
      formData
    );

  return response.data;
}

export async function deleteAdminProduct(
  productId: number
): Promise<void> {

  await apiClient.delete(
    `/admin/products/${productId}`
  );
}