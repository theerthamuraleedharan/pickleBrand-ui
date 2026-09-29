import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { getCurrentUser } from "../api/authApi";
import {
  clearOidcApplicationToken,
  getOidcAuth,
  isAccountLinkingError,
  isOidcMode,
  setOidcSessionFailureHandler,
} from "../auth/oidc";
import {
  getActiveAuthMethod,
  setActiveAuthMethod,
} from "../auth/authSession";
import type { AuthResponse, AuthUser } from "../types/Auth";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import {
  clearAuthentication,
  getAccessToken,
  getStoredUser,
  saveAuthentication,
} from "../utils/authStorage";

export type AuthStatus = "loading" | "ready" | "error" | "expired";

interface AuthContextValue {
  user: AuthUser | null;
  authenticated: boolean;
  oidcEnabled: boolean;
  authStatus: AuthStatus;
  authError: string | null;
  completeAuthentication: (response: AuthResponse) => void;
  startLogin: (returnTo?: unknown) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const oidcEnabled = isOidcMode();
  const [hasLocalSession, setHasLocalSession] = useState(
    () => Boolean(getAccessToken() && getStoredUser()),
  );
  const [user, setUser] = useState<AuthUser | null>(() =>
    getAccessToken() ? getStoredUser() : null,
  );
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    oidcEnabled && !hasLocalSession ? "loading" : "ready",
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const logoutInProgress = useRef(false);
  const sessionExpired = useRef(false);
  const skipOidcAutoInit = useRef(false);

  useEffect(() => {
    setOidcSessionFailureHandler(() => {
      if (logoutInProgress.current || sessionExpired.current) return;

      sessionExpired.current = true;
      skipOidcAutoInit.current = true;
      clearAuthentication();
      clearOidcApplicationToken();
      setHasLocalSession(false);
      setActiveAuthMethod("none");
      setUser(null);
      setAuthStatus("expired");
      setAuthError("Your session has expired. Sign in again to continue.");
    });

    return () => setOidcSessionFailureHandler(null);
  }, []);

  useEffect(() => {
    if (!oidcEnabled || hasLocalSession || skipOidcAutoInit.current) return;

    let mounted = true;
    setActiveAuthMethod("none");

    async function initializeAuthentication() {
      try {
        const authenticated = await getOidcAuth().initialize();
        if (!mounted) return;
        if (getActiveAuthMethod() === "local") return;
        if (!authenticated) {
          setAuthStatus("ready");
          return;
        }

        setActiveAuthMethod("oidc");
        try {
          const currentUser = await getCurrentUser();
          if (!mounted) return;
          setUser(currentUser);
          setAuthError(null);
          setAuthStatus("ready");
        } catch (error) {
          if (!mounted) return;
          setUser(null);
          setAuthError(
            isAccountLinkingError(error)
              ? getApiErrorMessage(
                  error,
                  "This existing email needs administrator account linking. Sign out and choose another account.",
                )
              : getApiErrorMessage(error, "Unable to load your account."),
          );
          setAuthStatus("error");
        }
      } catch {
        if (!mounted) return;
        setActiveAuthMethod("none");
        setUser(null);
        setAuthError(
          "Keycloak could not initialize. Check that the OIDC services are running, then reload this page.",
        );
        setAuthStatus("error");
      }
    }

    void initializeAuthentication();
    return () => {
      mounted = false;
    };
  }, [hasLocalSession, oidcEnabled]);

  const completeAuthentication = useCallback(
    (response: AuthResponse) => {
      sessionExpired.current = false;
      saveAuthentication(response);
      setActiveAuthMethod("local");
      setHasLocalSession(true);
      setUser(response.user);
      setAuthError(null);
      setAuthStatus("ready");
    },
    [],
  );

  const startLogin = useCallback(
    async (returnTo?: unknown) => {
      if (!oidcEnabled) {
        throw new Error("Keycloak sign-in is only available in OIDC mode.");
      }
      sessionExpired.current = false;
      skipOidcAutoInit.current = false;
      setAuthError(null);
      try {
        clearAuthentication();
        setHasLocalSession(false);
        setUser(null);
        setActiveAuthMethod("none");
        await getOidcAuth().login(returnTo);
      } catch {
        setAuthStatus("error");
        setAuthError("Keycloak could not start sign-in. Please try again.");
        throw new Error("Keycloak login failed");
      }
    },
    [oidcEnabled],
  );

  const logout = useCallback(async () => {
    const activeMethod = getActiveAuthMethod();
    sessionExpired.current = false;
    skipOidcAutoInit.current = false;
    setUser(null);
    setAuthError(null);
    if (activeMethod !== "oidc") {
      clearAuthentication();
      setHasLocalSession(false);
      setActiveAuthMethod("none");
      setAuthStatus("ready");
      return;
    }

    setAuthStatus("ready");
    logoutInProgress.current = true;
    try {
      await getOidcAuth().logout();
    } catch {
      setAuthStatus("error");
      setAuthError("Sign-out could not reach Keycloak. Please try again.");
      throw new Error("Keycloak logout failed");
    } finally {
      logoutInProgress.current = false;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authenticated: user !== null,
      oidcEnabled,
      authStatus,
      authError,
      completeAuthentication,
      startLogin,
      logout,
    }),
    [
      user,
      oidcEnabled,
      authStatus,
      authError,
      completeAuthentication,
      startLogin,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
