import { lingui } from "@lingui/vite-plugin";
import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from "@remix-run/dev";
import { flatRoutes } from "remix-flat-routes";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import babelMacros from "vite-plugin-babel-macros";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/cloudflare" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    remixCloudflareDevProxy(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
      ignoredRouteFiles: ["**/*"],
      routes: async (defineRoutes) => flatRoutes("routes", defineRoutes),
    }),
    tsconfigPaths(),
    babelMacros(),
    lingui(),
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
      await import("./app/css/fetch.js");
    },
  };
}
