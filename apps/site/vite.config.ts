import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  /*
   * In production the API Worker serves this site, so /api is same-origin.
   * The dev server borrows the live API so the roadmap section has data.
   */
  server: {
    proxy: {
      "/api": { target: "https://nitroping.dev", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Requests reach this site through the API Worker, which owns /assets.
    assetsDir: "site-assets",
    rollupOptions: { input: { main: "index.html", notFound: "404.html" } },
  },
});
