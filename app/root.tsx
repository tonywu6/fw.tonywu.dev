import "./css/vendor/fonts.css";
import "./tailwind.css";

import type { Messages } from "@lingui/core";
import { I18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { selectLanguage } from "./i18n";

export async function loader({ request }: LoaderFunctionArgs) {
  return {
    i18n: selectLanguage(request),
  };
}

export const links: LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
];

export default function App() {
  const {
    i18n: { catalog, locale },
  } = useLoaderData<typeof loader>();
  const i18n = new I18n({});
  i18n.load(locale, catalog as Messages);
  i18n.activate(locale);
  return (
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    </I18nProvider>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      refetchInterval: 0,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  },
});
