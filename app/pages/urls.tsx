import { data } from "react-router";

import { forwarded } from "~/components/Forwarded/.server";

import type { Route } from "./+types/urls";

export const urls: Record<string, string> = {
  "immediately-partial-plastic": "https://tonywu6.github.io/ferrosaur/",
  "more-compassionate-submitter": "https://tonywu6.github.io/mdbookkit/rustdoc-link/",
};

export async function loader(args: Route.LoaderArgs) {
  const {
    params: { slug },
  } = args;
  const url = urls[slug];
  if (url) {
    return await forwarded({ url })(args);
  } else {
    throw data(null, { status: 404, statusText: "Not Found" });
  }
}

export { Forwarded as default, meta } from "~/components/Forwarded";
