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
        name: "Angle Meter",
        short_name: "Angle Meter",
        description: "Measure surface inclination using your phone's motion sensors",
        theme_color: "#0a0a0f",
        background_color: "#0a0a0f",
        display: "fullscreen",
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
