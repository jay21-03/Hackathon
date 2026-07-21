import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@ckeditor") || id.includes("ckeditor5")) {
              return "vendor-ckeditor";
            }
            if (id.includes("xlsx")) {
              return "vendor-xlsx";
            }
            if (id.includes("axios")) {
              return "vendor-http";
            }
            if (id.includes("@tanstack/react-query")) {
              return "vendor-query";
            }
            if (id.includes("zod")) {
              return "vendor-zod";
            }
            if (id.includes("dompurify")) {
              return "vendor-sanitize";
            }
            if (id.includes("react")
              || id.includes("react-dom")
              || id.includes("react-router-dom")
              || id.includes("@remix-run")) {
              return "vendor-react";
            }
            if (id.includes("@react-oauth")) {
              return "vendor-auth";
            }
            return undefined;
          }
          if (id.includes("/src/domain/schemas") || id.includes("/src/utils/dateTimeValidation")) {
            return "validation-schemas";
          }
          if (id.includes("/src/utils/sanitizeProblemHtml")) {
            return "sanitize-rich-html";
          }
          if (id.includes("/src/pages/organizer/BoardManagementPage")) {
            return "organizer-board-management";
          }
          if (id.includes("/src/components/organizer/board-management/")) {
            return "organizer-board-management";
          }
          if (id.includes("/src/pages/organizer/ResultsHubPage")) {
            return "organizer-results-hub";
          }
          return undefined;
        }
      }
    }
  },
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
