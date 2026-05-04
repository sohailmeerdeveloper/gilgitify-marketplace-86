import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // VITE_DEPLOY_TARGET=pages gives the repo-name base needed for GitHub Pages.
  // Default (Hostinger / local) uses "/" so the API at /api/*.php is reachable.
  base: process.env.VITE_DEPLOY_TARGET === "pages"
    ? "/gilgitify-marketplace-86/"
    : "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
