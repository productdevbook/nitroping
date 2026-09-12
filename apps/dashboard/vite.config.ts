import { defineConfig } from "vite";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));
const workerPublicDir = fileURLToPath(new URL("../api/public", import.meta.url));

const cleanWorkerBuild = () => ({
  name: "nitroping-clean-worker-build",
  buildStart() {
    // Never ship stale hashed assets from an earlier dashboard build. The
    // marketing site lives in apps/site and is deployed separately.
    for (const directory of ["assets", "dashboard-assets"])
      rmSync(`${workerPublicDir}/${directory}`, { recursive: true, force: true });
    for (const filename of ["dashboard.html", "portal.html", "follow-up.html"])
      rmSync(`${workerPublicDir}/${filename}`, { force: true });
  },
});

/*
 * In production the Worker serves dashboard.html for every path under
 * /dashboard so the router can own them. The dev server has three entry
 * documents and no such rule, so it gets the same one here — otherwise a deep
 * link only works once it is deployed.
 */
const clientRoutes = () => ({
  name: "nitroping-client-routes",
  configureServer(server: {
    middlewares: {
      use: (handler: (request: { url?: string }, response: unknown, next: () => void) => void) => void;
    };
  }) {
    server.middlewares.use((request, _response, next) => {
      const [path] = (request.url ?? "").split("?");
      if (path === "/dashboard" || path?.startsWith("/dashboard/"))
        request.url = "/dashboard.html";
      next();
    });
  },
});

export default defineConfig({
  plugins: [cleanWorkerBuild(), clientRoutes(), react(), tailwindcss()],
  resolve: { alias: { "@": srcDir } },
  // Dev only: the dashboard talks to the Worker running under `wrangler dev`,
  // so unminified React errors can be reproduced against real data.
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8787",
      "/auth": "http://127.0.0.1:8787",
    },
  },
  build: {
    outDir: "../api/public",
    emptyOutDir: false,
    rollupOptions: { input: { dashboard: "dashboard.html", portal: "portal.html", followUp: "follow-up.html" }, output: { assetFileNames: "dashboard-assets/[name]-[hash][extname]" } },
  },
});
