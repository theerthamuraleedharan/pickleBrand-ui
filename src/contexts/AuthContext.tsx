import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { AuthResponse, AuthUser } from "../types/Auth";
import {
  clearAuthentication,
  getStoredUser,
  saveAuthentication,
} from "../utils/authStorage";

interface AuthContextValue {
  user: AuthUser | null;
  authenticated: boolean;
  completeAuthentication: (
    response: AuthResponse
  ) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
}: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authenticated: user !== null,

      completeAuthentication(response) {
        saveAuthentication(response);
        setUser(response.user);
      },

      logout() {
        clearAuthentication();
        setUser(null);
      },
    }),
    [user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}