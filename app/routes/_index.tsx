import type { MetaFunction } from "@remix-run/cloudflare";

export const meta: MetaFunction = () => [{ title: "index.html" }];

export default function Page() {
  return (
    <p className="max-w-[1024px] px-4 py-6 sm:px-6 sm:py-8">
      Page intentionally left blank.
    </p>
  );
}
