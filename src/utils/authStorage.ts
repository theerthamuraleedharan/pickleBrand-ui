import type { AuthResponse, AuthUser } from "../types/Auth";

const TOKEN_KEY = "sujus_pickle_access_token";
const USER_KEY = "sujus_pickle_user";

export function saveAuthentication(
  response: AuthResponse
): void {
  sessionStorage.setItem(
    TOKEN_KEY,
    response.accessToken
  );

  sessionStorage.setItem(
    USER_KEY,
    JSON.stringify(response.user)
  );
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const value = sessionStorage.getItem(USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    clearAuthentication();
    return null;
  }
}

export function clearAuthentication(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}