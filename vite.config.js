// filepath: c:\Users\user\Documents\projects\Commisions\hope-hub\vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import postcssTailwind from "@tailwindcss/postcss";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    host: true
  },
  plugins: [react()],
  css: {
    postcss: {
      plugins: [postcssTailwind()],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});