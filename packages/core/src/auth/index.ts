// Better-Auth server instance. Mounted by the frontend at /api/auth via the
// Vite dev middleware; in production run it behind an HTTP server.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { SignJWT, importPKCS8 } from "jose";
import { getDatabase } from "../db/client.js";
import { authUsers, authSessions, authAccounts, authVerifications } from "../db/schema.js";

// Apple's clientSecret is a JWT signed with the .p8 ES256 key (per Apple's
// docs + better-auth reference implementation). Regenerated per sign-in flow,
// 180-day expiry stays under Apple's 6-month cap.
async function generateAppleClientSecret(clientId: string, teamId: string, keyId: string, privateKey: string) {
  const key = await importPKCS8(privateKey, "ES256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(now)
    .setExpirationTime(now + 180 * 24 * 60 * 60)
    .sign(key);
}

const BASE_URL = process.env.AUTH_BASE_URL || "http://localhost:5173";

export function createAuth() {
  // Only register providers that actually have credentials — unconfigured
  // providers get an honest "not configured" error instead of a 500 typo path.
  const socialProviders: Record<string, unknown> = {};
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
   socialProviders.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Persist refresh tokens (Google only issues them on first consent)
      accessType: "offline",
      prompt: "select_account consent",
    };
  }
  if (
    process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY
  ) {
    const clientId = process.env.APPLE_CLIENT_ID;
    const privateKey = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n");
    const teamId = process.env.APPLE_TEAM_ID!;
    const keyId = process.env.APPLE_KEY_ID!;
    socialProviders.apple = async () => ({
      clientId,
      clientSecret: await generateAppleClientSecret(clientId, teamId, keyId, privateKey),
      ...(process.env.APPLE_APP_BUNDLE_IDENTIFIER
        ? { appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER }
        : {}),
    });
  }
  return betterAuth({
    database: drizzleAdapter(getDatabase(), {
      provider: "sqlite",
      schema: {
        user: authUsers,
        session: authSessions,
        account: authAccounts,
        verification: authVerifications,
      },
    }),
    // Dev-only fallback secret; set AUTH_SECRET env for production.
    secret: process.env.AUTH_SECRET || "dev-insecure-secret-do-not-ship",
    baseURL: BASE_URL,
    // appleid.apple.com is required for Sign In with Apple flows.
    trustedOrigins: [BASE_URL, "https://appleid.apple.com"],
    emailAndPassword: {
      enabled: true,
    },
    socialProviders,
  });
}

let authInstance: ReturnType<typeof createAuth> | null = null;

export function getAuth() {
  if (!authInstance) authInstance = createAuth();
  return authInstance;
}

// Re-export the handler type for consumers (vite middleware).
export type { betterAuth } from "better-auth";
