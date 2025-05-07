import { forwarded } from "~/components/Forwarded/.server";

export const loader = forwarded({
  url: "https://tonywu6.github.io/ferrosaur/",
});

export { Forwarded as default, meta } from "~/components/Forwarded";
