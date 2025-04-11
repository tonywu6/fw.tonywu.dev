import { Trans, useLingui } from "@lingui/react/macro";
import type { MetaFunction } from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";
import { useQuery } from "@tanstack/react-query";
import { importJWK, jwtDecrypt } from "jose";
import type { CSSProperties, RefObject } from "react";
import { Fragment, useEffect, useRef, useState } from "react";
import { twJoin } from "tailwind-merge";

import type { forwarded } from "./.server";

export const meta: MetaFunction = () => [{ title: "index.html" }];

export function Forwarded() {
  const { decrypt, hashable, reason } = useForwarded();

  const { t } = useLingui();

  const inner = useRef<HTMLCanvasElement>(null);
  const width = useClientWidth(inner);

  const { data: { initHeight, drawBlocking, drawLater } = {} } = useQuery({
    queryKey: [String(decrypt), hashable, width],
    enabled: width !== undefined,
    queryFn: async () => {
      const url = await decrypt();

      const left = 0;
      const top = 2;

      const small = window.matchMedia("(width < 40rem)").matches;

      const fontSize = small ? 20 : 24;
      const lineHeight = fontSize * 1.4;

      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const style = dark
        ? {
            protocol: "#8a9199",
            host: "#59c2ff",
            pathname: "#59c2ff",
            search: "#d2a6ff",
            hash: "#95e6cb",
            normal: 300,
            strong: 600,
          }
        : {
            protocol: "#565b66",
            host: "#2663a0",
            pathname: "#2663a0",
            search: "#6e5688",
            hash: "#39705e",
            normal: 400,
            strong: 600,
          };

      const font = "Roboto Mono, ui-monospace, monospace";

      const text = {
        text: [
          {
            text: url.protocol + "//",
            fill: style.protocol,
            font: `${style.normal} ${fontSize}px ${font}`,
          },
          {
            text: url.host,
            fill: style.host,
            font: `${style.strong} ${fontSize}px ${font}`,
          },
          {
            text: url.pathname,
            fill: style.pathname,
            font: `${style.normal} ${fontSize}px ${font}`,
          },
          {
            text: url.search,
            fill: style.search,
            font: `${style.normal} ${fontSize}px ${font}`,
          },
          {
            text: url.hash,
            fill: style.hash,
            font: `${style.normal} ${fontSize}px ${font}`,
          },
        ],
        wordBreaks: /[:/.?+ -]/u,
      } satisfies StyledParagraph;

      const drawer = drawText({
        width: unwrap({ width }),
        leading: lineHeight,
        left: scaled(left),
        top: scaled(top),
        paragraph: text,
      });

      const bboxHeight = (measured: number) => top * 2 + measured;

      const initHeight = bboxHeight(drawer.measure().height);

      function drawBlocking() {
        drawer.draw(({ height }) => {
          height = bboxHeight(height);
          const canvas = unwrap({ canvas: inner.current });
          canvas.style.height = `${height}px`;
          canvas.width = scaled(unwrap({ width }));
          canvas.height = scaled(height);
          const ctx = canvas.getContext("2d")!;
          ctx.resetTransform();
          ctx.scale(scaled(1), scaled(1));
          return ctx;
        });
      }

      async function drawLater() {
        await drawer.fonts().catch(() => {});
        drawBlocking();
      }

      return { initHeight, drawBlocking, drawLater };
    },
  });

  useEffect(() => {
    drawBlocking?.();
    drawLater?.();
  }, [drawBlocking, drawLater]);

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(window.setTimeout(() => setCopied(undefined), 5_000));
      })
      .catch(() => {});
  };

  const [copied, setCopied] = useState<number>();

  useEffect(
    () => () => {
      if (copied) {
        window.clearTimeout(copied);
      }
    },
    [copied],
  );

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <main
        className={twJoin(
          "px-4 py-6 w-full min-w-0 max-w-[1024px]",
          "sm:px-6 sm:py-8",
          "flex flex-col items-stretch gap-4",
        )}
      >
        {copied === undefined ? (
          <p>
            <Trans>
              Click link below to copy, then continue in a standard browser.
            </Trans>
          </p>
        ) : (
          <p>
            <Trans>
              <span className="text-[#5f7632] dark:text-[#aad94c]">
                <IconCheck />
                Link copied,{" "}
              </span>
              <span>paste into a standard browser to continue.</span>
            </Trans>
          </p>
        )}
        <div
          role="link"
          title={t`Click to copy`}
          aria-keyshortcuts="Enter"
          tabIndex={0}
          onClick={() => copyToClipboard()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              copyToClipboard();
            }
          }}
          className={twJoin(
            "flex flex-col justify-center items-stretch",
            "focus:outline-[1.5px] focus:outline-offset-8",
            "focus:outline-[#2663a0] dark:focus:outline-[#59c2ff]",
            "pb-0.5 cursor-pointer",
            // must have boxes to have a width to measure height
            // so cannot be display: none here
            initHeight === undefined ? "invisible" : null,
          )}
        >
          <canvas height={0} style={{ height: initHeight }} ref={inner}></canvas>
        </div>
      </main>
      <footer
        className={twJoin(
          "px-4 py-4 w-full min-w-0 max-w-[1024px]",
          "sm:px-6 sm:py-6",
          "flex flex-col items-stretch gap-2",
        )}
      >
        <p className="text-sm dark:text-neutral-300">
          <Trans>You are seeing this page because of:</Trans>
        </p>
        <pre className="text-sm whitespace-pre-wrap leading-[1.4] group">
          {reason.map(({ text, style }, idx) => {
            let inner = <code>{text}</code>;
            switch (style) {
              case "strong":
                inner = (
                  <strong
                    className={twJoin(
                      "text-[#c53601] dark:text-[#ff8f40]",
                      "font-bold",
                    )}
                  >
                    {inner}
                  </strong>
                );
                break;
              case "normal":
                inner = (
                  <span
                    className={twJoin(
                      "text-[#c53601] dark:text-[#ff8f40]",
                      "opacity-60 dark:opacity-30",
                      "group-hover:opacity-90",
                    )}
                  >
                    {inner}
                  </span>
                );
                break;
            }
            return <Fragment key={`${text}-${idx}`}>{inner}</Fragment>;
          })}
        </pre>
      </footer>
    </div>
  );
}

function useClientWidth(elem: RefObject<HTMLElement>) {
  const [width, setWidth] = useState(elem.current?.clientWidth);

  useEffect(() => {
    const { current: target } = elem;
    if (!target) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === target) {
          setWidth(target.clientWidth);
          break;
        }
      }
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [elem]);

  return width;
}

function drawText(options: PlaceLetters) {
  const { width } = options;
  const { place, fonts } = placeLetters(options);

  const measure = () => {
    const canvas = document.createElement("canvas");
    canvas.width = scaled(width);
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scaled(1), scaled(1));
    const letters = [...place(ctx)];
    const height = letters.slice(-1)[0].bottom;
    return { letters, height };
  };

  const draw = (setup: (options: { height: number }) => CanvasRenderingContext2D) => {
    const { letters, height } = measure();
    const ctx = setup({ height });
    ctx.save();
    ctx.textBaseline = "top";
    for (const { char, left, top, font, fill } of letters) {
      ctx.font = font;
      ctx.fillStyle = fill;
      ctx.fillText(char, left, top);
    }
    ctx.restore();
  };

  return { fonts, measure, draw };
}

type PlaceLetters = {
  width: number;
  leading: number;
  left: number;
  top: number;
  paragraph: StyledParagraph;
};

type StyledParagraph = {
  text: StyledText[];
  wordBreaks?: RegExp;
  letterSpacing?: number;
};

type StyledText = {
  text: string;
  font: NonNullable<CSSProperties["font"]>;
  fill: CanvasRenderingContext2D["fillStyle"];
};

function placeLetters(options: PlaceLetters) {
  const {
    paragraph: { text: paragraph, wordBreaks = / /, letterSpacing = 0 },
    width: lineWidth,
  } = options;

  const phrases: StyledText[] = [];
  {
    let phrase: StyledText = { text: "", font: "", fill: "" };
    let shouldBreak = false;
    for (const { text, font, fill } of paragraph) {
      phrase.font = font;
      phrase.fill = fill;
      for (const char of [...text]) {
        if (shouldBreak) {
          if (!wordBreaks.test(char)) {
            phrases.push(phrase);
            phrase = { text: char, font, fill };
            shouldBreak = false;
          } else {
            phrase.text += char;
          }
        } else {
          shouldBreak = wordBreaks.test(char);
          phrase.text += char;
        }
      }
      phrases.push(phrase);
      phrase = { text: "", font: "", fill: "" };
    }
  }

  async function fonts() {
    await Promise.all(phrases.map(({ font, text }) => document.fonts.load(font, text)));
  }

  function* place(ctx: CanvasRenderingContext2D) {
    const { leading } = options;
    let { left, top } = options;
    const origin = { left, top };
    let descent = 0;

    const newline = (measured: TextMetrics) => {
      const { actualBoundingBoxDescent } = measured;
      top += leading;
      left = origin.left;
      descent = actualBoundingBoxDescent;
    };

    ctx.save();
    ctx.textBaseline = "top";

    for (const { text, font, fill } of phrases) {
      ctx.font = font;

      {
        const measured = ctx.measureText(text);
        const { width } = measured;
        if (left + width > lineWidth && width <= lineWidth) {
          newline(measured);
        }
      }

      for (const char of [...text]) {
        const measured = ctx.measureText(char);
        const { width, actualBoundingBoxDescent } = measured;

        if (left + width > lineWidth) {
          newline(measured);
        } else {
          descent = Math.max(descent, actualBoundingBoxDescent);
        }
        const bottom = top + descent;

        yield { char, font, fill, left, top, bottom };

        left += width + letterSpacing;
      }
    }

    ctx.restore();
  }

  return { place, fonts };
}

function scaled(px: number) {
  const dpr = window.devicePixelRatio || 1;
  return px * dpr;
}

function useForwarded() {
  const { jwk, jwt, reason } = useLoaderData<Loader>();
  return {
    decrypt: async () => {
      const key = await importJWK(jwk);
      const {
        payload: { [claim]: raw },
      } = await jwtDecrypt(jwt, key);
      return new URL(raw as string);
    },
    hashable: [jwk, jwt] as unknown,
    reason,
  };
}

function IconCheck() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4 relative top-[-1px] me-1 inline"
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function unwrap<T>(data: Record<string, T | null | undefined>): T {
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined) {
      throw new Error(`${k} is ${String(v)}`);
    }
    return v;
  }
  throw new Error("unreachable: data is empty");
}

type Loader = ReturnType<typeof forwarded>;

export const claim = "example:url";
