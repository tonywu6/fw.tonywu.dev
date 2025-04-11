import { match } from "@formatjs/intl-localematcher";

import { messages as en } from "./locales/en/messages";
import { messages as zhHans } from "./locales/zh-Hans/messages";

const available = {
  ["en"]: en,
  ["zh-Hans"]: zhHans,
};

export function selectLanguage(req: Request) {
  const requested = acceptLanguage(req.headers.get("accept-language") ?? "");
  const locale = match(requested, Object.keys(available), "en");
  const catalog = available[locale as keyof typeof available];
  return { locale, catalog };
}

function acceptLanguage(header: string): string[] {
  const locales: { tag: string; q: number }[] = [];
  for (const value of header
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)) {
    const [tag, q = "1"] = value.split(";q=");
    const qv = Number(q);
    if (Number.isNaN(qv)) {
      continue;
    }
    locales.push({ tag, q: Number(q) });
  }
  locales.sort(({ q: q1 }, { q: q2 }) => q2 - q1);
  return locales.map(({ tag }) => tag);
}
