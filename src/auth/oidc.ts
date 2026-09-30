import Keycloak, {
  type KeycloakInitOptions,
  type KeycloakLoginOptions,
  type KeycloakLogoutOptions,
} from "keycloak-js";

const RETURN_TO_KEY = "sujus_pickle_oidc_return_to";
const OIDC_SCOPES = "openid profile email";

export interface OidcAdapter {
  authenticated?: boolean;
  token?: string;
  onAuthLogout?: () => void;
  init(options: KeycloakInitOptions): Promise<boolean>;
  login(options?: KeycloakLoginOptions): Promise<void>;
  logout(options?: KeycloakLogoutOptions): Promise<void>;
  updateToken(minValidity?: number): Promise<boolean>;
  clearToken(): void;
}

export function getOidcCallbackUri(origin: string): string {
  return new URL("/oidc/callback", origin).toString();
}

export function getOidcLogoutUri(origin: string): string {
  return new URL("/login", origin).toString();
}

export function sanitizeInternalRoute(
  value: unknown,
  origin = window.location.origin,
): string | null {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return null;
  }

  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function getRoleHome(role: "CUSTOMER" | "ADMIN"): string {
  return role === "ADMIN" ? "/admin" : "/products";
}

export function isAccountLinkingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const response = "response" in error ? error.response : undefined;
  if (!response || typeof response !== "object" || !("data" in response)) {
    return false;
  }

  const data = response.data;
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  const message = [record.message, record.detail]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  return message.toLowerCase().includes("account linking");
}

export function createOidcAuth(adapter: OidcAdapter) {
  let initialization: Promise<boolean> | null = null;
  let refresh: Promise<boolean> | null = null;

  function initialize(): Promise<boolean> {
    // One shared init promise prevents StrictMode's effect replay from initializing twice.
    if (!initialization) {
      // Keycloak consumes the callback here before AuthProvider allows protected routes through.
      initialization = adapter.init({
        onLoad: "check-sso",
        flow: "standard",
        pkceMethod: "S256",
        redirectUri: getOidcCallbackUri(window.location.origin),
        scope: OIDC_SCOPES,
      });
    }
    return initialization;
  }

  return {
    initialize,

    async getAccessToken(): Promise<string | null> {
      const authenticated = await initialize();
      if (!authenticated || !adapter.authenticated || !adapter.token) {
        return null;
      }

      // Every request waiting on an expiring token shares the same refresh call.
      if (!refresh) {
        // The adapter refreshes with its in-memory refresh token; callers only receive access tokens.
        refresh = adapter.updateToken(30).finally(() => {
          refresh = null;
        });
      }
      await refresh;
      return adapter.token ?? null;
    },

    async login(returnTo?: unknown, idpHint?: "google"): Promise<void> {
      const safeRoute = sanitizeInternalRoute(returnTo);
      if (safeRoute) {
        sessionStorage.setItem(RETURN_TO_KEY, safeRoute);
      } else {
        sessionStorage.removeItem(RETURN_TO_KEY);
      }
      // Keycloak owns both the normal login page and its Google broker redirect.
      await adapter.login({
        redirectUri: getOidcCallbackUri(window.location.origin),
        scope: OIDC_SCOPES,
        ...(idpHint ? { idpHint } : {}),
      });
    },

    async logout(): Promise<void> {
      sessionStorage.removeItem(RETURN_TO_KEY);
      await adapter.logout({
        redirectUri: getOidcLogoutUri(window.location.origin),
      });
    },

    clearToken(): void {
      adapter.clearToken();
    },
  };
}

export type OidcAuth = ReturnType<typeof createOidcAuth>;

let oidcAuth: OidcAuth | null = null;
let sessionFailureHandler: (() => void) | null = null;

export function isOidcMode(): boolean {
  return import.meta.env.VITE_AUTH_MODE === "oidc";
}

export function getOidcAuth(): OidcAuth {
  if (oidcAuth) return oidcAuth;

  const { VITE_OIDC_URL, VITE_OIDC_REALM, VITE_OIDC_CLIENT_ID } =
    import.meta.env;
  if (!VITE_OIDC_URL || !VITE_OIDC_REALM || !VITE_OIDC_CLIENT_ID) {
    throw new Error(
      "OIDC mode requires VITE_OIDC_URL, VITE_OIDC_REALM, and VITE_OIDC_CLIENT_ID.",
    );
  }

  // A public browser client has no secret; PKCE protects the authorization-code exchange.
  const adapter = new Keycloak({
    url: VITE_OIDC_URL,
    realm: VITE_OIDC_REALM,
    clientId: VITE_OIDC_CLIENT_ID,
  });
  adapter.onAuthLogout = handleOidcSessionFailure;
  oidcAuth = createOidcAuth(adapter);
  return oidcAuth;
}

export function setOidcSessionFailureHandler(
  handler: (() => void) | null,
): void {
  sessionFailureHandler = handler;
}

export function handleOidcSessionFailure(): void {
  sessionFailureHandler?.();
}

export function clearOidcApplicationToken(): void {
  oidcAuth?.clearToken();
}

export function consumePostLoginRoute(): string | null {
  const value = sessionStorage.getItem(RETURN_TO_KEY);
  sessionStorage.removeItem(RETURN_TO_KEY);
  return sanitizeInternalRoute(value);
}
