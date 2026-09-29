import axios from "axios";

import {
  getOidcAuth,
  handleOidcSessionFailure,
} from "../auth/oidc";
import { getActiveAuthMethod } from "../auth/authSession";
import { getAccessToken } from "../utils/authStorage";

interface ApiClientOptions {
  getOidcToken: () => Promise<string | null>;
  getLocalToken: () => string | null;
  getAuthMethod: () => "local" | "oidc" | "none";
  onSessionExpired?: () => void;
}

export function createApiClient({
  getOidcToken,
  getLocalToken,
  getAuthMethod,
  onSessionExpired,
}: ApiClientOptions) {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
    timeout: 10_000,
  });

  client.interceptors.request.use(async (config) => {
    let accessToken: string | null;
    const authMethod = getAuthMethod();
    try {
      accessToken =
        authMethod === "oidc"
          ? await getOidcToken()
          : authMethod === "local"
            ? getLocalToken()
            : null;
    } catch (error) {
      if (authMethod === "oidc") onSessionExpired?.();
      return Promise.reject(error);
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (getAuthMethod() !== "oidc" || !axios.isAxiosError(error)) {
        return Promise.reject(error);
      }

      const url = error.config?.url?.split("?")[0].replace(/\/+$/, "");
      if (
        error.response?.status === 401 &&
        url !== "/auth/me" &&
        !url?.endsWith("/auth/me")
      ) {
        onSessionExpired?.();
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export const apiClient = createApiClient({
  getOidcToken: () => getOidcAuth().getAccessToken(),
  getLocalToken: getAccessToken,
  getAuthMethod: getActiveAuthMethod,
  onSessionExpired: handleOidcSessionFailure,
});

export const publicApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 10_000,
});
