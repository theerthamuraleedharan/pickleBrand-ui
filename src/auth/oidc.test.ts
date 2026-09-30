import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createOidcAuth,
  getOidcCallbackUri,
  getOidcLogoutUri,
  getRoleHome,
  isAccountLinkingError,
  sanitizeInternalRoute,
  type OidcAdapter,
} from "./oidc";

function createAdapter(overrides: Partial<OidcAdapter> = {}) {
  const adapter: OidcAdapter = {
    authenticated: true,
    token: "access-token",
    init: vi.fn().mockResolvedValue(true),
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    updateToken: vi.fn().mockResolvedValue(false),
    clearToken: vi.fn(),
    ...overrides,
  };
  return adapter;
}

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("window", { location: { origin: "http://localhost:5173" } });
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OIDC authentication", () => {
  it("shares initialization across StrictMode effect replays", async () => {
    const adapter = createAdapter();
    const auth = createOidcAuth(adapter);

    const first = auth.initialize();
    const replay = auth.initialize();

    expect(first).toBe(replay);
    await Promise.all([first, replay]);
    expect(adapter.init).toHaveBeenCalledTimes(1);
    expect(adapter.init).toHaveBeenCalledWith(
      expect.objectContaining({
        onLoad: "check-sso",
        flow: "standard",
        pkceMethod: "S256",
        redirectUri: "http://localhost:5173/oidc/callback",
        scope: "openid profile email",
      }),
    );
  });

  it("shares a token refresh among concurrent protected requests", async () => {
    let finishRefresh: ((value: boolean) => void) | undefined;
    const adapter = createAdapter({
      updateToken: vi.fn(
        () =>
          new Promise<boolean>((resolve) => {
            finishRefresh = resolve;
          }),
      ),
    });
    const auth = createOidcAuth(adapter);

    const first = auth.getAccessToken();
    const second = auth.getAccessToken();
    await Promise.resolve();
    await Promise.resolve();
    finishRefresh?.(true);

    await expect(Promise.all([first, second])).resolves.toEqual([
      "access-token",
      "access-token",
    ]);
    expect(adapter.updateToken).toHaveBeenCalledTimes(1);
    expect(adapter.updateToken).toHaveBeenCalledWith(30);
  });

  it("uses the registered post-login and post-logout routes", () => {
    expect(getOidcCallbackUri("http://localhost:5173")).toBe(
      "http://localhost:5173/oidc/callback",
    );
    expect(getOidcLogoutUri("http://localhost:5173")).toBe(
      "http://localhost:5173/login",
    );
  });

  it("uses Keycloak's identity-provider hint for Google without a browser OAuth flow", async () => {
    const adapter = createAdapter();
    const auth = createOidcAuth(adapter);

    await auth.login("/products", "google");

    expect(adapter.login).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectUri: "http://localhost:5173/oidc/callback",
        scope: "openid profile email",
        idpHint: "google",
      }),
    );
  });

  it("routes using the backend role and rejects external return URLs", () => {
    expect(getRoleHome("CUSTOMER")).toBe("/products");
    expect(getRoleHome("ADMIN")).toBe("/admin");
    expect(
      sanitizeInternalRoute("/admin/products?sort=name", "http://localhost:5173"),
    ).toBe("/admin/products?sort=name");
    expect(
      sanitizeInternalRoute("https://attacker.example", "http://localhost:5173"),
    ).toBeNull();
    expect(
      sanitizeInternalRoute("//attacker.example", "http://localhost:5173"),
    ).toBeNull();
  });

  it("detects account-linking responses without depending on token claims", () => {
    expect(
      isAccountLinkingError({
        response: {
          data: { message: "Account linking is required" },
        },
      }),
    ).toBe(true);
    expect(
      isAccountLinkingError({
        response: { data: { message: "Access denied" } },
      }),
    ).toBe(false);
  });

  it("offers logout without relying on profile loading", async () => {
    const adapter = createAdapter();
    const auth = createOidcAuth(adapter);

    await auth.logout();

    expect(adapter.logout).toHaveBeenCalledWith({
      redirectUri: "http://localhost:5173/login",
    });
  });
});
