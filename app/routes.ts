import { route } from "@react-router/dev/routes";
import type { RouteConfig } from "@react-router/dev/routes";

export default [
  route("/", "./pages/index.tsx"),
  route("/u", "./pages/sitemap.tsx"),
  route("/u/:slug", "./pages/urls.tsx"),
] satisfies RouteConfig;
