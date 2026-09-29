# Sujus Pickle UI

React + TypeScript storefront. Local username/password authentication remains the default.

## Local development

Install dependencies with `npm install`, then run `npm run dev`. Vite serves the UI and
proxies `/api` to `http://localhost:8080`. The default mode uses the existing backend
login/register endpoints and keeps its legacy session-storage behavior.

## Keycloak OIDC demo

Start Keycloak and the backend as described in the backend's `OIDC_GUIDE.md`. The backend
must run with `SPRING_PROFILES_ACTIVE=oidc`. From this UI directory, run:

```powershell
npm run dev -- --mode oidc --port 5173 --strictPort
```

The `.env.oidc` file sets the public Keycloak URL, realm and client ID. The configured
login callback is `http://localhost:5173/oidc/callback`; logout returns to
`http://localhost:5173/login`. Use `localhost` consistently.

In this profile, the storefront keeps its ordinary email/password customer login and
registration forms and also offers Keycloak sign-in. The browser starts one Keycloak
adapter in `check-sso` mode and processes redirects before protected routes are displayed.
Local accounts use the shop's existing registration/login endpoints; Keycloak identities
are still subject to the backend's explicit account-linking policy. Login with Keycloak
uses Authorization Code with PKCE S256 and the
`openid profile email` scopes. Keycloak handles state, nonce, verifier and callback
validation. The browser is a public client, so it has no client secret; a secret embedded
in downloaded JavaScript would not be secret. PKCE binds code redemption to the browser's
original verifier, so intercepting an authorization code alone is not enough to redeem it.

Access, refresh and ID tokens remain in the adapter's memory. API requests use only the
access token in the Bearer header, refreshed with a 30-second validity margin. The ID token
is for the UI's authentication session and is never sent to the API. After login, the UI
loads `/api/auth/me`; the returned numeric local user ID and `CUSTOMER`/`ADMIN` role drive
cart ownership and navigation. The backend remains authoritative for permissions.

Keycloak self-registration is disabled for this local demo, but customers can create a
shop account using the regular registration form. These preconfigured Keycloak accounts
are only for demonstrating SSO:

| Role | Username | Password |
| --- | --- | --- |
| Customer | `demo-customer` | `Customer-demo-2026!` |
| Store administrator | `demo-store-admin` | `Admin-demo-2026!` |

For a customer demonstration, sign in at `/login`, visit products/cart/profile, then log
out from the header. For an admin demonstration, use `/admin/login` and the store-admin
account; an ordinary customer is still rejected from admin routes based on the backend
role. Logout ends the Keycloak session and clears application user state, but locally
validated JWT access tokens already issued can remain valid until their five-minute expiry
(plus normal clock-skew tolerance).

Run `npm test` for focused OIDC/API authentication tests and `npm run build` for the
production TypeScript and Vite build.
