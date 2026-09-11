import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../api/public",
    emptyOutDir: false,
    rollupOptions: { input: "dashboard.html", output: { assetFileNames: "dashboard-assets/[name]-[hash][extname]" } },
  },
});
