export type AuthMethod = "local" | "oidc" | "none";

let activeAuthMethod: AuthMethod = "local";

export function getActiveAuthMethod(): AuthMethod {
  return activeAuthMethod;
}

export function setActiveAuthMethod(method: AuthMethod): void {
  activeAuthMethod = method;
}
