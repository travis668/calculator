import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        entryFileNames: "src/app.js",
        chunkFileNames: "src/[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") {
            return "src/styles.css";
          }

          return "assets/[name][extname]";
        },
      },
    },
  },
});
