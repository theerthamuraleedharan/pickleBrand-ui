import { describe, expect, it, vi } from "vitest";
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

import { createApiClient } from "./apiClient";

describe("protected API client", () => {
  it("attaches only the refreshed access token to protected requests", async () => {
    const getOidcToken = vi.fn().mockResolvedValue("access-token");
    const client = createApiClient({
      getOidcToken,
      getLocalToken: () => "legacy-token",
      getAuthMethod: () => "oidc",
    });
    let responseConfig: AxiosResponse["config"] | undefined;

    await client.get("/orders", {
      adapter: async (config) => {
        responseConfig = config;
        return {
          config,
          data: {},
          headers: {},
          status: 200,
          statusText: "OK",
        };
      },
    });

    expect(getOidcToken).toHaveBeenCalledOnce();
    expect(responseConfig?.headers.Authorization).toBe("Bearer access-token");
    expect(client.defaults.timeout).toBe(10_000);
  });

  it("keeps legacy session authentication as the default path", async () => {
    const client = createApiClient({
      getOidcToken: vi.fn(),
      getLocalToken: () => "legacy-token",
      getAuthMethod: () => "local",
    });
    let responseConfig: AxiosResponse["config"] | undefined;

    await client.get("/products", {
      adapter: async (config) => {
        responseConfig = config;
        return {
          config,
          data: [],
          headers: {},
          status: 200,
          statusText: "OK",
        };
      },
    });

    expect(responseConfig?.headers.Authorization).toBe("Bearer legacy-token");
  });

  it("switches token sources according to the signed-in method", async () => {
    let authMethod: "local" | "oidc" | "none" = "local";
    const getOidcToken = vi.fn().mockResolvedValue("keycloak-access-token");
    const client = createApiClient({
      getOidcToken,
      getLocalToken: () => "local-access-token",
      getAuthMethod: () => authMethod,
    });
    const seenAuthorization: Array<string | undefined> = [];
    const adapter = async (config: InternalAxiosRequestConfig) => {
      seenAuthorization.push(config.headers.Authorization as string | undefined);
      return {
        config,
        data: {},
        headers: {},
        status: 200,
        statusText: "OK",
      };
    };

    await client.get("/profile", { adapter });
    authMethod = "oidc";
    await client.get("/profile", { adapter });
    authMethod = "none";
    await client.get("/products", { adapter });

    expect(seenAuthorization).toEqual([
      "Bearer local-access-token",
      "Bearer keycloak-access-token",
      undefined,
    ]);
    expect(getOidcToken).toHaveBeenCalledOnce();
  });

  it("does not treat forbidden responses or account-linking profile failures as expiry", async () => {
    const onSessionExpired = vi.fn();
    const client = createApiClient({
      getOidcToken: vi.fn().mockResolvedValue("access-token"),
      getLocalToken: () => null,
      getAuthMethod: () => "oidc",
      onSessionExpired,
    });

    await expect(
      client.get("/admin", {
        adapter: async (config) => {
          throw new AxiosError("Forbidden", undefined, config, undefined, {
            config,
            data: {},
            headers: {},
            status: 403,
            statusText: "Forbidden",
          });
        },
      }),
    ).rejects.toBeDefined();
    await expect(
      client.get("/auth/me", {
        adapter: async (config) => {
          throw new AxiosError("Account linking required", undefined, config, undefined, {
            config,
            data: { message: "Account linking required" },
            headers: {},
            status: 401,
            statusText: "Unauthorized",
          });
        },
      }),
    ).rejects.toBeDefined();
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("clears application authentication on other 401 responses without replay", async () => {
    const onSessionExpired = vi.fn();
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError("Unauthorized", undefined, config, undefined, {
        config,
        data: {},
        headers: {},
        status: 401,
        statusText: "Unauthorized",
      });
    });
    const client = createApiClient({
      getOidcToken: vi.fn().mockResolvedValue("access-token"),
      getLocalToken: () => null,
      getAuthMethod: () => "oidc",
      onSessionExpired,
    });

    await expect(client.post("/checkout", {}, { adapter })).rejects.toBeDefined();
    expect(adapter).toHaveBeenCalledOnce();
    expect(onSessionExpired).toHaveBeenCalledOnce();
  });

  it("clears a local session after a protected request returns 401", async () => {
    const onSessionExpired = vi.fn();
    const client = createApiClient({
      getOidcToken: vi.fn(),
      getLocalToken: () => "expired-local-token",
      getAuthMethod: () => "local",
      onSessionExpired,
    });

    await expect(
      client.get("/admin/dashboard", {
        adapter: async (config) => {
          throw new AxiosError("Unauthorized", undefined, config, undefined, {
            config,
            data: { message: "Please login with valid access token" },
            headers: {},
            status: 401,
            statusText: "Unauthorized",
          });
        },
      }),
    ).rejects.toBeDefined();

    expect(onSessionExpired).toHaveBeenCalledOnce();
  });

  it("does not expire a session when an unauthenticated request returns 401", async () => {
    const onSessionExpired = vi.fn();
    const client = createApiClient({
      getOidcToken: vi.fn(),
      getLocalToken: () => null,
      getAuthMethod: () => "none",
      onSessionExpired,
    });

    await expect(
      client.get("/public-resource", {
        adapter: async (config) => {
          throw new AxiosError("Unauthorized", undefined, config, undefined, {
            config,
            data: {},
            headers: {},
            status: 401,
            statusText: "Unauthorized",
          });
        },
      }),
    ).rejects.toBeDefined();

    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("clears application authentication when a token refresh fails", async () => {
    const onSessionExpired = vi.fn();
    const client = createApiClient({
      getOidcToken: vi.fn().mockRejectedValue(new Error("refresh failed")),
      getLocalToken: () => null,
      getAuthMethod: () => "oidc",
      onSessionExpired,
    });

    await expect(client.get("/profile")).rejects.toThrow("refresh failed");
    expect(onSessionExpired).toHaveBeenCalledOnce();
  });
});
