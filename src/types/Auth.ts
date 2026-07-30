export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}