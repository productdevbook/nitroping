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

export default defineConfig({
  plugins: [cleanWorkerBuild(), react(), tailwindcss()],
  resolve: { alias: { "@": srcDir } },
  build: {
    outDir: "../api/public",
    emptyOutDir: false,
    rollupOptions: { input: { dashboard: "dashboard.html", portal: "portal.html", followUp: "follow-up.html" }, output: { assetFileNames: "dashboard-assets/[name]-[hash][extname]" } },
  },
});
