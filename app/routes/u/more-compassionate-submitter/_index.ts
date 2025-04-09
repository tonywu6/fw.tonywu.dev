import { Forwarded } from "~/components/Forwarded";
import { forwarded } from "~/components/Forwarded/.server";

export { Forwarded as default };

export const loader = forwarded({
  url: "https://developers.cloudflare.com/workers/wrangler/configuration/#bindings",
});
