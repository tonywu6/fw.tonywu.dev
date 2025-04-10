import { forwarded } from "~/components/Forwarded/.server";

export const loader = forwarded({
  url: "https://web.dev/articles/optimize-cls?hl=de#images-without-dimensions",
});

export { Forwarded as default, meta } from "~/components/Forwarded";
