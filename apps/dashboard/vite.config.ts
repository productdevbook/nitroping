import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": srcDir } },
  build: {
    outDir: "../api/public",
    emptyOutDir: false,
    rollupOptions: { input: { dashboard: "dashboard.html", portal: "portal.html" }, output: { assetFileNames: "dashboard-assets/[name]-[hash][extname]" } },
  },
});
