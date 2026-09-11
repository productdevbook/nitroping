import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Requests reach this site through the API Worker, which owns /assets.
    assetsDir: "site-assets",
    rollupOptions: { input: { main: "index.html", notFound: "404.html" } },
  },
});
