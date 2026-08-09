import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import wasm from "vite-plugin-wasm";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [wasm()],
  server: {
    // plesk -> apache & ngnix settings -> custom headers -> added these manually
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        gui: resolve(root, "gui/index.html"),
      },
    },
  },
  optimizeDeps: {
    exclude: ["vim-wasm"],
  },
  worker: {
    format: "es",
  },
});
