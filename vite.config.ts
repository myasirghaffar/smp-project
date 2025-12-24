import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: false,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: false,
  },
  build: {
    outDir: "dist",
    sourcemap: mode === "development",
    minify: mode === "production" ? "esbuild" : false,
    chunkSizeWarningLimit: 600,
    // Allow Rollup/Vite to decide optimal chunking. Custom manualChunks
    // can lead to subtle evaluation-order issues with React peer deps.
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
