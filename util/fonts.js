// @ts-check

import * as fs from "node:fs/promises";
import * as net from "node:net";
import * as pathlib from "node:path";

import * as esbuild from "esbuild";

// https://github.com/nodejs/undici/issues/2990
net.setDefaultAutoSelectFamilyAttemptTimeout(5000);

const outdir = relpath("../app/css/vendor");

await fs.rm(outdir, { recursive: true, force: true });

await esbuild.build({
  bundle: true,
  format: "esm",
  target: ["chrome93", "firefox93", "safari15", "es2020"],
  platform: "browser",
  plugins: [remoteCSS()],
  entryPoints: [relpath("../app/css/fonts.css")],
  outdir,
});

/** @returns {esbuild.Plugin} */
function remoteCSS() {
  return {
    name: "remote-css",
    setup: (build) => {
      const cacheDir = relpath("../app/css/.cache");

      build.onResolve(
        {
          filter: /^https:\/\//,
          namespace: "file",
        },
        ({ path, kind }) =>
          kind === "import-rule" ? { path, namespace: "remote-css" } : undefined,
      );

      build.onResolve(
        {
          filter: /^https:\/\//,
          namespace: "remote-css",
        },
        ({ path, kind }) =>
          kind === "url-token" ? { path, namespace: "remote-url" } : undefined,
      );

      build.onLoad(
        {
          filter: /.*/,
          namespace: "remote-css",
        },
        async ({ path }) => {
          const result = await cachedFetch(path, {
            headers: {
              "user-agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/93.0",
            },
          })
            .then((res) => new TextDecoder().decode(res))
            .then((text) => /** @type {const} */ ({ type: "ok", text }))
            .catch((err) => /** @type {const} */ ({ type: "err", err }));

          if (result.type === "err") {
            return {
              contents: `@import url(${JSON.stringify(path)});`,
              loader: "css",
              warnings: [{ text: `failed to download ${path}: ${result.err}` }],
            };
          }

          return { contents: result.text, loader: "css" };
        },
      );

      build.onLoad(
        {
          filter: /.*/,
          namespace: "remote-url",
        },
        async ({ path }) => {
          const result = await cachedFetch(path)
            .then((blob) => /** @type {const} */ ({ type: "ok", blob }))
            .catch((err) => /** @type {const} */ ({ type: "err", err }));

          if (result.type === "err") {
            return {
              errors: [{ text: `failed to download ${path}: ${result.err}` }],
            };
          }

          return { contents: result.blob, loader: "copy" };
        },
      );

      /** @param {Parameters<typeof fetch>} param */
      async function cachedFetch(...param) {
        const [input, init] = param;

        const key = await crypto.subtle
          .digest("SHA-256", new TextEncoder().encode(JSON.stringify({ input, init })))
          .then(encodeHex);

        const cachePath = pathlib.join(cacheDir, key);

        try {
          return await fs.readFile(cachePath);
        } catch {
          // ignored
        }

        const contents = await fetch(input, init)
          .then((res) => {
            if (res.status >= 400) {
              throw new Error(res.statusText);
            } else {
              return res;
            }
          })
          .then((res) => res.arrayBuffer())
          .then((buffer) => new Uint8Array(buffer));

        await fs.mkdir(cacheDir, { recursive: true });
        await fs.writeFile(cachePath, contents);

        return contents;
      }
    },
  };
}

/** @param {string} path */
function relpath(path) {
  return new URL(path, import.meta.url).pathname;
}

/** @param {ArrayBuffer} buf */
function encodeHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
