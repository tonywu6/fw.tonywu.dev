import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { EncryptJWT, exportJWK, generateSecret } from "jose";

import { claim } from "./";

export function forwarded({ url }: { url: string }) {
  return async function loader({ request }: LoaderFunctionArgs) {
    const detected = detectUserAgent(request.headers.get("user-agent") || "");
    switch (detected.action) {
      case "allowed": {
        const res = redirect(url, { status: 307 });
        res.headers.append("Vary", "Origin");
        res.headers.append("Vary", "User-Agent");
        return res;
      }
      case "blocked": {
        const key = await generateSecret(enc, { extractable: true });
        const jwt = await new EncryptJWT({ [claim]: url.toString() })
          .setProtectedHeader({ alg: "dir", enc })
          .setIssuedAt()
          .setExpirationTime("5m")
          .encrypt(key);
        const jwk = await exportJWK(key);
        // this doesn't actually encrypt anything because we are sending the key
        // this is just for obfuscation
        const { reason } = detected;
        return { jwt, jwk, reason };
      }
    }
  };
}

type UserAgentAction =
  | {
      action: "allowed";
    }
  | {
      action: "blocked";
      reason: ReasonText[];
    };

type ReasonText = { style: "normal" | "strong"; text: string };

function detectUserAgent(ua: string): UserAgentAction {
  const explain = ([index, emphasis]: [number, string]): ReasonText[] => {
    return [
      { text: "User-Agent: ", style: "strong" },
      { text: ua.slice(0, index), style: "normal" },
      { text: ua.slice(index, index + emphasis.length), style: "strong" },
      { text: ua.slice(index + emphasis.length), style: "normal" },
    ];
  };

  for (const token of ua.matchAll(/(?<product>[^ ]+)\/(?<version>[^ ]+)/g)) {
    const { product } = token.groups ?? {};
    if (blockProducts.has(product)) {
      return { action: "blocked", reason: explain([token.index, product]) };
    }
  }

  if (!ua.trim()) {
    return { action: "blocked", reason: explain([0, ua]) };
  } else {
    return { action: "allowed" };
  }
}

const enc = "A128GCM";

const blockProducts = new Set(["Firefox", "Chrome"]);
