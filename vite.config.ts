import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    rollupOptions: {
      output: {
	manualChunks: (id) =>
	  id.includes("node_modules") ? "vendor" : undefined,
      },
    },
  },
});
