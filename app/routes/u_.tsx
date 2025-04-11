import * as fs from "node:fs/promises";

import { Trans } from "@lingui/react/macro";
import type { MetaFunction } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { Fragment } from "react";
import { twJoin } from "tailwind-merge";

import { useCJKFonts } from "~/i18n";

export const meta: MetaFunction = () => [{ title: "index.html" }];

export async function loader() {
  if (!import.meta.env.DEV) {
    return { pages: [] };
  }

  const items = await fs
    .readdir(new URL("./u/", import.meta.url), {
      withFileTypes: true,
    })
    .then((items) => items.filter((entry) => entry.isDirectory()));

  const pages = items
    .map(({ name }) => [name, import(`./u/${name}/_index.tsx`)] as const)
    .map(([slug, f]) => f.then(({ loader: { url } }) => ({ slug, url })));

  return {
    pages: await Promise.all(pages).then((p) => {
      p.sort(({ url: u1 }, { url: u2 }) => u1.localeCompare(u2));
      return p;
    }),
  };
}

export default function Page() {
  const { pages } = useLoaderData<typeof loader>();

  const cjkFonts = useCJKFonts();

  if (!import.meta.env.DEV) {
    return (
      <p className={twJoin("max-w-[1024px] px-4 py-4 sm:px-6 sm:py-8", cjkFonts)}>
        <Trans>Page intentionally left blank.</Trans>
      </p>
    );
  }

  return (
    <div
      className={twJoin(
        "max-w-[1024px] px-4 py-4 sm:px-6 sm:py-8",
        "grid items-baseline gap-2",
        "sm:grid-cols-[max-content_auto] sm:gap-3",
      )}
    >
      {pages.map(({ slug, url }) => (
        <Fragment key={slug}>
          <p>
            <Link to={slug}>
              <code className="text-cyan-500">{slug}</code>
            </Link>
          </p>
          <p>
            <a href={url} target="_blank" rel="noreferrer" className="text-blue-500">
              <code>{url}</code>
            </a>
          </p>
        </Fragment>
      ))}
    </div>
  );
}
