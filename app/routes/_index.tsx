import type { MetaFunction } from "@remix-run/cloudflare";

export const meta: MetaFunction = () => [{ title: "index.html" }];

export default function Index() {
  return <p>Page intentionally left blank.</p>;
}
