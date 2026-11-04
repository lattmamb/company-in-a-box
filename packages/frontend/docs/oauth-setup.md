# OAuth setup — Google + Apple sign-in

Implementation: `packages/core/src/auth/index.ts` (server) mounted at `/api/auth`
by `packages/frontend/vite.config.ts` dev middleware, client in
`packages/frontend/src/contexts/auth-context.tsx`.

Secrets go in `packages/frontend/.env.local` (never committed).

Reference implementation: **https://github.com/better-auth/examples**
(framework-specific apps using this exact library) and the provider sources at
`github.com/better-auth/better-auth/tree/main/packages/core/src/social-providers`.

## After editing .env.local

```bash
# 1. Rebuild the auth bundle (node can't import the TS sources directly)
node node_modules/.pnpm/esbuild*/node_modules/esbuild/bin/esbuild \
  packages/core/src/auth/index.ts --bundle --platform=node --format=esm \
  --external:better-auth --external:drizzle-orm --external:@libsql/client \
  --external:ulid --outfile=packages/core/dist/auth-handler.mjs
# (or: pnpm auth:build from the repo root)

# 2. Restart the dev server (node caches the old bundle)
```

Once credentials are in `.env.local` and the server restarted, the Apple/Google
buttons appear automatically on the login and register pages (the UI checks
`/api/auth/config`). With no credentials they are hidden instead of erroring.

## Google

1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** → Web application.
2. Authorized redirect URIs:
   - Dev: `http://localhost:5173/api/auth/callback/google`
   - Prod: `https://yourdomain.com/api/auth/callback/google`
3. Copy Client ID / Secret into `.env.local` → restart dev.

Works against localhost in dev. "Sign in with Google" button redirects to
Google, then better-auth completes the callback and lands on `/dashboard`.

## Apple

Requires an **Apple Developer account ($99/yr)**. Apple's `clientSecret` is not
a static string — the server generates an ES256 JWT from your `.p8` key
automatically (see `generateAppleClientSecret` in `core/src/auth/index.ts`),
so you provide 4 env values instead:

| Env var | Where from |
|---|---|
| `APPLE_CLIENT_ID` | Service ID (not the App ID) |
| `APPLE_TEAM_ID` | Developer account settings |
| `APPLE_KEY_ID` | Keys tab, after creating the "Sign in with Apple" key |
| `APPLE_PRIVATE_KEY` | contents of the downloaded `.p8` file (`\n`-escaped) |

Steps: App ID (with Sign In with Apple capability) → Service ID (configure
domains + return URLs) → Key (download `.p8` once).

**Critical: Apple refuses `http` and `localhost`** — you need HTTPS. For local
dev, tunnel the dev server:

```bash
cloudflared tunnel --url http://localhost:5173
# or: ngrok http 5173
```

Then register `https://<tunnel-domain>/api/auth/callback/apple` as the Service
ID return URL, and set `AUTH_BASE_URL=https://<tunnel-domain>` in
`.env.local` so better-auth builds the right callback URL.

Gotchas baked into the implementation:
- Apple sends `email` **only on first consent** — later sign-ins omit it
  (their user-info endpoint doesn't exist). better-auth handles account
  persistence; first sign-in is when the email is stored.
- `APPLE_APP_BUNDLE_IDENTIFIER` is only for native iOS ID-token flows — leave
  unset for web-only; setting it can shadow the Service ID audience on Android.
- Client secret JWT expires after 180 days — regenerated dynamically here, so
  no manual rotation.

## Production notes

- Set `AUTH_BASE_URL=https://yourdomain.com` and a strong random
  `AUTH_SECRET` (`openssl rand -base64 32`).
- The Vite dev middleware is dev-only; for production run
  `core/src/auth/index.ts`'s handler behind an HTTP server (or proxy `/api/auth`
  to the bundle run under `tsx`/bun). Not yet wired — flag when deploying.
