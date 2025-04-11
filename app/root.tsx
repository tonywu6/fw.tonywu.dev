import "./css/vendor/fonts.css";
import "./tailwind.css";

import type { Messages } from "@lingui/core";
import { I18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  useRouteLoaderData,
} from "@remix-run/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Fragment, type PropsWithChildren } from "react";

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
  const i18n = useI18n();
  return (
    <html lang={i18n.locale}>
      <head>
        <Head />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <I18nProvider i18n={i18n}>
            <Body>
              <Outlet />
            </Body>
          </I18nProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const i18n = useI18n();

  const error = useRouteError();

  let status = 500;
  let statusText = "Internal Server Error";
  if (isRouteErrorResponse(error)) {
    status = error.status;
    statusText = error.statusText;
  }

  if (status >= 500) {
    console.error(error);
  }

  const title = `${status}.html`;

  return (
    <html lang={i18n.locale}>
      <head>
        <title>{title}</title>
        <Head />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <I18nProvider i18n={i18n}>
            <Body>
              <h1 className="max-w-[1024px] px-4 py-6 sm:px-6 sm:py-8">
                <a
                  href={`https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/${status}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-pink-600 dark:text-pink-400"
                >
                  <code className="rounded-lg px-1.5 py-1 bg-pink-400/10">
                    {status}
                  </code>{" "}
                  <span className="underline">{statusText}</span>
                </a>
              </h1>
            </Body>
          </I18nProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

function useI18n() {
  const { i18n: { locale = "en", catalog = {} } = {} } =
    useRouteLoaderData<typeof loader>("root") ?? {};

  const i18n = new I18n({});
  i18n.load(locale, catalog as Messages);
  i18n.activate(locale);

  return i18n;
}

function Head() {
  return (
    <Fragment>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <Meta />
      <Links />
    </Fragment>
  );
}

function Body({ children }: PropsWithChildren) {
  return (
    <Fragment>
      {children}
      <ScrollRestoration />
      <Scripts />
    </Fragment>
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
