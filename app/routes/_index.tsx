import { Trans } from "@lingui/react/macro";
import type { MetaFunction } from "@remix-run/cloudflare";
import { twJoin } from "tailwind-merge";

import { useCJKFonts } from "~/i18n";

export const meta: MetaFunction = () => [{ title: "index.html" }];

export default function Page() {
  const cjkFonts = useCJKFonts();
  return (
    <p className={twJoin("max-w-[1024px] px-4 py-4 sm:px-6 sm:py-8", cjkFonts)}>
      <Trans>Page intentionally left blank.</Trans>
    </p>
  );
}
