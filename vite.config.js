import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/angle-meter/",
  build: {
    outDir: "docs",
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "Neigungsmesser",
        short_name: "Neigungsmesser",
        description: "Messe die Neigung einer Oberfläche mit den Sensoren deines Telefons",
        theme_color: "#1A1A1A",
        background_color: "#1A1A1A",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "/angle-meter/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/angle-meter/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/angle-meter/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
    }),
  ],
});
