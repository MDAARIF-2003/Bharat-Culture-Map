import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { createApiHandler } from "./server/api-handler";

/**
 * Mounts the Bharat CultureMap /api/v1/* backend directly inside Vite's dev
 * server so `pnpm run dev` serves both the frontend and the SQLite-backed API
 * on the same port without needing a separate server process.
 *
 * Lazily initializes `createApiHandler()` inside `configureServer` so that
 * `pnpm run build` (`vite build`) does not open or lock the SQLite database
 * during static asset bundling.
 */
function vitePluginBharatCultureMapApi(): Plugin {
  return {
    name: "bharat-culturemap-api",
    configureServer(server: ViteDevServer) {
      let apiHandler: ReturnType<typeof createApiHandler> | null = null;
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/api/v1/")) {
          if (!apiHandler) {
            apiHandler = createApiHandler();
          }
          void apiHandler(req, res, next);
          return;
        }
        next();
      });
    },
  };
}

/**
 * Serves local fallback images from client/public/manus-storage/ when
 * external storage proxy credentials are not configured.
 */
function vitePluginStorageProxy(): Plugin {
  return {
    name: "manus-storage-proxy",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/manus-storage", async (req, res, next) => {
        const forgeBaseUrl = (
          process.env.BUILT_IN_FORGE_API_URL || ""
        ).replace(/\/+$/, "");
        const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;

        // Fall back to static files in client/public/manus-storage/ when offline or unconfigured
        if (!forgeBaseUrl || !forgeKey) {
          next();
          return;
        }

        const key = req.url?.replace(/^\//, "");
        if (!key) {
          next();
          return;
        }

        try {
          const forgeUrl = new URL("v1/storage/presign/get", forgeBaseUrl + "/");
          forgeUrl.searchParams.set("path", key);

          const forgeResp = await fetch(forgeUrl, {
            headers: { Authorization: `Bearer ${forgeKey}` },
          });

          if (!forgeResp.ok) {
            next();
            return;
          }

          const { url } = (await forgeResp.json()) as { url: string };
          if (!url) {
            next();
            return;
          }

          res.writeHead(307, { Location: url, "Cache-Control": "no-store" });
          res.end();
        } catch {
          next();
        }
      });
    },
  };
}

const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginBharatCultureMapApi(),
  vitePluginStorageProxy(),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: false,
    host: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      ".local",
      ...(process.env.VITE_ALLOWED_HOSTS
        ? process.env.VITE_ALLOWED_HOSTS.split(",").map(h => h.trim()).filter(Boolean)
        : []),
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
