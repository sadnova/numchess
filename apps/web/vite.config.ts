import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Numchess Ultimate",
        short_name: "Numchess",
        description: "Shared numerical board strategy",
        theme_color: "#eef1f8",
        background_color: "#eef1f8",
        display: "standalone",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2,wav,ogg,mp3,json}"],
      },
    }),
  ],
  vite: {
    worker: {
      format: "es",
    },
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@numchess/engine": path.resolve(
        __dirname,
        "../../packages/engine/src/index.ts",
      ),
    },
  },
});
