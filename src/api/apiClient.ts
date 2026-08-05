import axios from "axios";
import { getAccessToken } from "../utils/authStorage";

export const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ??
    "/api",
  timeout: 1000,
});

export const publicApiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ??
    "/api",
  timeout: 1000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
