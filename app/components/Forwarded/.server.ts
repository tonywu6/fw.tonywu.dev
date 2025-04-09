import { EncryptJWT, exportJWK, generateSecret } from "jose";

import { claim } from ".";

export function forwarded({ url }: { url: string }) {
  return async function loader() {
    const key = await generateSecret(enc, { extractable: true });
    const jwt = await new EncryptJWT({ [claim]: url.toString() })
      .setProtectedHeader({ alg: "dir", enc })
      .setIssuedAt()
      .setExpirationTime("5m")
      .encrypt(key);
    const jwk = await exportJWK(key);
    // this doesn't actually encrypt anything because we are sending the key
    // this is just for obfuscation
    return { jwt, jwk };
  };
}

const enc = "A128GCM";
