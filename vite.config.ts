import { cloudflare } from "@cloudflare/vite-plugin";
import { lingui } from "@lingui/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import babelMacros from "vite-plugin-babel-macros";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    babelMacros(),
    lingui({ failOnCompileError: true, failOnMissing: true }),
    prebuild(),
  ],
  esbuild: { legalComments: "external" },
  build: {
    rollupOptions: {
      onwarn: (warning, log) => {
        if (
          warning.plugin === "vite:reporter" &&
          warning.message.includes("dynamic import will not move module") &&
          warning.message.includes("virtual:remix/server-build")
        ) {
          return;
        }
        log(warning);
      },
    },
  },
});

function prebuild(): Plugin {
  return {
    name: "prebuild",
    buildStart: async () => {
      await import("./util/fonts.js");
    },
  };
}
