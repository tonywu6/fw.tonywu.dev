import * as fs from "node:fs/promises";

import type { MetaFunction } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { Fragment } from "react";

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

  if (!import.meta.env.DEV) {
    return (
      <p className="max-w-[1024px] px-4 py-6 sm:px-6 sm:py-8">
        Page intentionally left blank.
      </p>
    );
  }

  return (
    <div
      className="max-w-[1024px] px-4 py-6 sm:px-6 sm:py-8"
      style={{
        display: "grid",
        gridTemplateColumns: "max-content auto",
        alignItems: "baseline",
        gap: 12,
      }}
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
