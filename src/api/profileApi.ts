import { apiClient } from "./apiClient";

import type {
  Address,
  AddressRequest,
  UpdateProfileRequest,
  UserProfile,
} from "../types/Profile";

export async function getProfile(): Promise<UserProfile> {
  const response =
    await apiClient.get<UserProfile>("/profile");

  return response.data;
}

export async function updateProfile(
  request: UpdateProfileRequest
): Promise<UserProfile> {
  const response =
    await apiClient.put<UserProfile>("/profile",request);

  return response.data;
}

export async function uploadProfilePhoto(
  file: File
): Promise<UserProfile> {
  const formData = new FormData();
  formData.append("photo", file);

  const response =
    await apiClient.post<UserProfile>(
      "/profile/photo",
      formData
    );

  return response.data;
}

export async function getProfilePhoto(): Promise<Blob> {
  const response = await apiClient.get<Blob>(
    "/profile/photo",
    {
      responseType: "blob",
    }
  );

  return response.data;
}

export async function deleteProfilePhoto(): Promise<void> {
  await apiClient.delete("/profile/photo");
}

export async function getAddresses(): Promise<Address[]> {
  const response =
    await apiClient.get<Address[]>(
      "/profile/addresses"
    );

  return response.data;
}

export async function createAddress(
  request: AddressRequest
): Promise<Address> {
  const response =
    await apiClient.post<Address>(
      "/profile/addresses",
      request
    );

  return response.data;
}

export async function deleteAddress(
  addressId: number
): Promise<void> {
  await apiClient.delete(
    `/profile/addresses/${addressId}`
  );
}