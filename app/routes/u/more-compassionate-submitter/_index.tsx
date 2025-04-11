import { forwarded } from "~/components/Forwarded/.server";

export const loader = forwarded({
  url: "https://tonywu6.github.io/mdbookkit/rustdoc-link/",
});

export { Forwarded as default, meta } from "~/components/Forwarded";
