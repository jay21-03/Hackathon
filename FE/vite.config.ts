import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      // Google Identity Services — https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups"
    },
    proxy: {
      "/api": {
        target: "http://localhost:8085",
        changeOrigin: true
      },
      "/ws": {
        target: "http://localhost:8085",
        changeOrigin: true,
        ws: true
      }
    }
  }
});
