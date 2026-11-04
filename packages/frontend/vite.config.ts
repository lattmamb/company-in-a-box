import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import type { IncomingMessage, ServerResponse } from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Collects the body of a connect request for the fetch-style conversion.
function readBody(req: IncomingMessage): Promise<string | undefined> {
  if (req.method === "GET" || req.method === "HEAD") return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("error", reject);
    req.on("end", () => resolve(Buffer.concat(chunks).toString() || undefined));
  });
}

// Mounts @company-in-a-box/core's better-auth handler at /api/auth inside the
// dev server. Requires `pnpm --filter @company-in-a-box/core build` so the
// dist JS exists — node cannot import the TS sources.
function betterAuthPlugin(env: Record<string, string>): Plugin {
  return {
    name: "better-auth-handler",
    configureServer(server) {
      for (const k of [
        "DATABASE_URL", "DATABASE_AUTH_TOKEN", "AUTH_SECRET", "AUTH_BASE_URL",
        "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET",
        "APPLE_CLIENT_ID", "APPLE_TEAM_ID", "APPLE_KEY_ID", "APPLE_PRIVATE_KEY",
        "APPLE_APP_BUNDLE_IDENTIFIER",
      ]) {
        if (env[k] !== undefined) process.env[k] = env[k];
      }

      // esbuild bundle of core's auth graph (TS can't be imported directly in
      // node; plain dist/ has extensionless ESM imports). Rebuild with:
      //   packages/core/node_modules # see dist/auth-handler.mjs build cmd in repo root ledger
      //   .pnpm/esbuild…/esbuild src/auth/index.ts --bundle --platform=node --format=esm \
      //     --external:better-auth --external:drizzle-orm --external:@libsql/client \
      //     --outfile=dist/auth-handler.mjs
      const handlerPromise = import(path.resolve(__dirname, "../core/dist/auth-handler.mjs")).then(
        (m: any) => m.getAuth().handler
      );
      handlerPromise.catch((err) => console.error(
        "[better-auth] handler failed to load — did you build core? (pnpm --filter @company-in-a-box/core build)\n", err?.message
      ));

      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        if (!req.url?.startsWith("/api/auth/")) return next();
        // Config introspection: which social providers have credentials. The
        // login/register pages use it to hide buttons that would only 404.
        if (req.url === "/api/auth/config") {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.end(
            JSON.stringify({
              google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
              apple: Boolean(
                env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID &&
                env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY
              ),
            })
          );
          return;
        }
        try {
          const authHandler = await handlerPromise;
          const url = `http://${req.headers.host ?? "localhost:5173"}${req.url}`;
          const body = await readBody(req);
          const request = new Request(url, {
            method: req.method,
            headers: req.headers as any,
            body,
          } as RequestInit);
          const response = await authHandler(request);
          res.statusCode = response.status;
          const cookies: string[] = [];
          response.headers.forEach((value: string, key: string) => {
            if (key.toLowerCase() === "set-cookie") cookies.push(value);
            else res.setHeader(key, value);
          });
          if (cookies.length) res.setHeader("set-cookie", cookies);
          res.end(await response.text());
        } catch (err: any) {
          console.error("[better-auth]", err?.message || err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err?.message || "auth handler error" }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load all vars (no VITE_ prefix filter) so server-side OAuth secrets reach
  // the middleware from .env / .env.local without ever hitting client code.
  const env = loadEnv(mode, __dirname, "");

  return {
    plugins: [react(), betterAuthPlugin(env)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@company-in-a-box/core": path.resolve(__dirname, "../core/src"),
        "@company-in-a-box/runtime": path.resolve(__dirname, "../runtime/src"),
        "@company-in-a-box/gateway": path.resolve(__dirname, "../gateway/src"),
        "@company-in-a-box/memory": path.resolve(__dirname, "../memory/src"),
        "@company-in-a-box/skills": path.resolve(__dirname, "../skills/src"),
        "@company-in-a-box/intelligence": path.resolve(__dirname, "../intelligence/src"),
        "@company-in-a-box/taxonomy": path.resolve(__dirname, "../taxonomy/src"),
        "@company-in-a-box/a2a": path.resolve(__dirname, "../a2a/src"),
        "@company-in-a-box/dev": path.resolve(__dirname, "../dev/src"),
        "@company-in-a-box/cli": path.resolve(__dirname, "../cli/src"),
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:3100",
          changeOrigin: true,
        },
      },
    },
  };
});
