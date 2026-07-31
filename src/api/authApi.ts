import { publicApiClient } from "./apiClient";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "../types/Auth";

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
