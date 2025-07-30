// @ts-check

import { defineConfig } from "@lingui/conf";

export default defineConfig({
  sourceLocale: "en",
  locales: ["zh-Hans", "en"],
  catalogs: [
    {
      path: "<rootDir>/app/i18n/{locale}/messages",
      include: ["app"],
    },
  ],
  format: "po",
  compileNamespace: "es",
});
