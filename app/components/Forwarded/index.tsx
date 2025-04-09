import { useLoaderData } from "@remix-run/react";
import { useQuery } from "@tanstack/react-query";
import { importJWK, jwtDecrypt } from "jose";
import type { CSSProperties, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { twJoin } from "tailwind-merge";

import type { forwarded } from "./.server";

export function Forwarded() {
  const { key, url } = useForwarded();

  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLCanvasElement>(null);
  const width = useClientWidth(outer);

  const { error } = useQuery({
    queryFn: async () => {
      await textbox({
        paragraph: {
          text: [
            {
              text: (await url()).toString(),
              font: "400 24px Roboto Mono",
              fill: "aquamarine",
            },
          ],
          wordBreaks: /[:/.?+ ]/u,
          lineHeight: 1.4,
        },
        width: width.current!,
        canvas: inner.current!,
      });

      return null;
    },
    queryKey: [String(textbox), width, key],
  });

  if (error) {
    throw error;
  }

  return (
    <div>
      <div
        className={twJoin(
          "w-full min-h-[40px]",
          "flex flex-col justify-center items-stretch",
        )}
        ref={outer}
      >
        <canvas height={0} ref={inner}></canvas>
      </div>
    </div>
  );
}

async function textbox(options: {
  paragraph: StyledParagraph;
  width: number;
  canvas: HTMLCanvasElement;
}) {
  const { paragraph, width, canvas } = options;

  const dpr = window.devicePixelRatio || 1;

  const ctx = canvas.getContext("2d")!;
  ctx.save();

  const setContext = () => {
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
  };

  const scaled = (px: number) => px * dpr;

  setContext();

  const top = 4;

  const drawer = await drawText({
    ctx,
    width,
    top: scaled(top),
    left: 0,
    paragraph,
  });

  const textHeight = drawer.height();
  const height = top * 2 + textHeight;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = scaled(width);
  canvas.height = scaled(height);

  setContext();

  drawer.draw();

  ctx.restore();
}

function useClientWidth(elem: RefObject<HTMLElement>) {
  const width = useRef(elem.current?.clientWidth);
  const [, setWidth] = useState(width.current);

  useEffect(() => {
    const { current: target } = elem;

    if (!target) {
      return;
    }

    width.current = target.clientWidth;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === target) {
          setWidth(entry.contentBoxSize[0].inlineSize);
          width.current = target.clientWidth;
          break;
        }
      }
    });

    observer.observe(target);

    return () => observer.disconnect();
  }, [elem]);

  return width;
}

async function drawText(options: PlaceLetters) {
  const { ctx } = options;
  const letters = [...(await placeLetters(options))];
  return {
    height: () => {
      return letters.slice(-1)[0].bottom;
    },
    draw: () => {
      ctx.save();
      ctx.textBaseline = "top";
      for (const { char, left, top, font, fill } of letters) {
        ctx.font = font;
        ctx.fillStyle = fill;
        ctx.fillText(char, left, top);
      }
      ctx.restore();
    },
  };
}

type PlaceLetters = {
  ctx: CanvasRenderingContext2D;
  width: number;
  left: number;
  top: number;
  paragraph: StyledParagraph;
};

type StyledParagraph = {
  text: StyledText[];
  wordBreaks?: RegExp;
  lineHeight?: number;
  letterSpacing?: number;
};

type StyledText = {
  text: string;
  font: NonNullable<CSSProperties["font"]>;
  fill: CanvasRenderingContext2D["fillStyle"];
};

async function placeLetters(options: PlaceLetters) {
  const {
    paragraph: { text: paragraph, wordBreaks = / /, lineHeight = 1, letterSpacing = 0 },
    width: lineWidth,
    ctx,
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

  let { left, top } = options;
  const origin = { left, top };
  let descent = 0;

  const measure = (text: string) => {
    const { emHeightAscent, emHeightDescent, actualBoundingBoxDescent, width } =
      ctx.measureText(text);
    const em = (emHeightDescent - emHeightAscent) * lineHeight;
    return { width, em, actualBoundingBoxDescent };
  };

  const newline = (measured: ReturnType<typeof measure>) => {
    const { em, actualBoundingBoxDescent } = measured;
    top += em;
    left = origin.left;
    descent = actualBoundingBoxDescent;
  };

  await Promise.all(phrases.map(({ font, text }) => document.fonts.load(font, text)));

  return (function* () {
    ctx.save();
    ctx.textBaseline = "top";

    for (const { text, font, fill } of phrases) {
      ctx.font = font;

      {
        const measured = measure(text);
        const { width } = measured;
        if (left + width > lineWidth && width <= lineWidth) {
          newline(measured);
        }
      }

      for (const char of [...text]) {
        const measured = measure(char);
        const { width, em, actualBoundingBoxDescent } = measured;

        if (left + width > lineWidth) {
          newline(measured);
        } else {
          descent = Math.max(descent, actualBoundingBoxDescent);
        }
        const bottom = top + descent;

        yield { char, font, fill, em, left, top, bottom };

        left += width + letterSpacing;
      }
    }

    ctx.restore();
  })();
}

function useForwarded() {
  const { jwk, jwt } = useLoaderData<Loader>();
  return {
    key: [jwk, jwt],
    url: async () => {
      const key = await importJWK(jwk);
      const {
        payload: { [claim]: raw },
      } = await jwtDecrypt(jwt, key);
      return new URL(raw as string);
    },
  };
}

type Loader = ReturnType<typeof forwarded>;

export const claim = "example:url";
