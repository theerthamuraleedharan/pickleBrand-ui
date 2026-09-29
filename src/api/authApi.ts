import { apiClient, publicApiClient } from "./apiClient";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "../types/Auth";
import type { AuthUser } from "../types/Auth";

export async function login(
  request: LoginRequest
): Promise<AuthResponse> {
  const response =
    await publicApiClient.post<AuthResponse>(
    "/auth/login",
    request
  );

  return response.data;
}

export async function register(
  request: RegisterRequest
): Promise<AuthResponse> {
  const response =
    await publicApiClient.post<AuthResponse>(
    "/auth/register",
    request
  );

  return response.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>("/auth/me");
  const user: unknown = response.data;
  if (!isAuthUser(user)) {
    throw new Error("The account profile response is invalid.");
  }
  return user;
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === "number" &&
    Number.isSafeInteger(user.id) &&
    user.id > 0 &&
    typeof user.firstName === "string" &&
    typeof user.lastName === "string" &&
    typeof user.email === "string" &&
    (user.role === "CUSTOMER" || user.role === "ADMIN")
  );
}
