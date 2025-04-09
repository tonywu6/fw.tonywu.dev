import type { CSSProperties, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { stableHash } from "stable-hash";

export type Forwarded = {
  url: string;
};

export function createCheckpoint({ url }: Forwarded) {
  function Checkpoint() {
    const outer = useRef<HTMLDivElement>(null);
    const inner = useTextbox({ text: url, font: "24px monospace", outer });
    return (
      <div>
        <p>Lorem ipsum</p>
        <div ref={outer} className="w-screen min-h-[40px] flex items-center">
          <canvas height={0} ref={inner}></canvas>
        </div>
        <p>dolor sit amet</p>
      </div>
    );
  }

  Checkpoint.displayName = `Checkpoint(${url})`;

  return Checkpoint;
}

function useTextbox(options: {
  text: string;
  font: NonNullable<CSSProperties["font"]>;
  outer: RefObject<HTMLElement>;
}) {
  const { text, font, outer } = options;

  const inner = useRef<HTMLCanvasElement>(null);

  const [rendered, setRendered] = useState<string>();

  useEffect(() => {
    const canvas = inner.current;
    const parent = outer.current;

    if (!canvas || !parent) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const { width } = parent.getBoundingClientRect();

    const observer = new ResizeObserver((entries) =>
      entries.forEach((entry) => {
        if (entry.target === parent && entry.contentBoxSize[0].inlineSize !== width) {
          setRendered(undefined);
        }
      }),
    );

    observer.observe(parent);

    const cleanup = () => {
      observer.disconnect();
    };

    const hash = canvasHash({ text, font, width, dpr });

    if (rendered === hash) {
      return cleanup;
    } else {
      setRendered(hash);
    }

    const ctx = canvas.getContext("2d")!;
    ctx.save();

    const setContext = () => {
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
      ctx.font = font;
      ctx.fillStyle = "rebeccapurple";
    };

    setContext();

    const drawer = drawText({
      ctx,
      text,
      wordBreaks: /[:/.?]/u,
      top: 0,
      left: 0,
      lineHeight: 1.2,
    });

    const height = drawer.height();
    canvas.width = width * dpr;
    canvas.style.width = `${width}px`;
    canvas.height = height * dpr;
    canvas.style.height = `${height}px`;

    setContext();

    drawer.draw();
    ctx.restore();

    return cleanup;
  }, [font, outer, rendered, text]);

  return inner;
}

function drawText(options: PlaceLetters) {
  const { ctx } = options;
  const letters = [...placeLetters(options)];
  return {
    height: () => {
      return letters.slice(-1)[0].bottom;
    },
    draw: () => {
      ctx.save();
      ctx.textBaseline = "top";
      for (const { char, left, top } of letters) {
        ctx.fillText(char, left, top);
      }
      ctx.restore();
    },
  };
}

type PlaceLetters = {
  ctx: CanvasRenderingContext2D;
  text: string;
  left: number;
  top: number;
  wordBreaks?: RegExp;
  lineHeight?: number;
  letterSpacing?: number;
};

function* placeLetters(options: PlaceLetters) {
  const { ctx, text, wordBreaks = / /, lineHeight = 1, letterSpacing = 0 } = options;

  const phrases: string[] = [];
  {
    let phrase = "";
    let shouldBreak = false;
    for (const char of [...text]) {
      if (shouldBreak) {
        if (!wordBreaks.test(char)) {
          phrases.push(phrase);
          phrase = char;
          shouldBreak = false;
        } else {
          phrase += char;
        }
      } else {
        shouldBreak = wordBreaks.test(char);
        phrase += char;
      }
    }
    phrases.push(phrase);
  }

  let { left, top } = options;
  const origin = { left, top };
  let descent = 0;

  const bbox = ctx.canvas.getBoundingClientRect();

  ctx.save();
  ctx.textBaseline = "top";

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

  for (const phrase of phrases) {
    {
      const measured = measure(phrase);
      const { width } = measured;
      if (left + width > bbox.width && width <= bbox.width) {
        newline(measured);
      }
    }

    for (const char of [...phrase]) {
      const measured = measure(char);
      const { width, em, actualBoundingBoxDescent } = measured;

      if (left + width > bbox.width) {
        newline(measured);
      } else {
        descent = Math.max(descent, actualBoundingBoxDescent);
      }

      const bottom = top + descent;
      yield { char, em, left, top, bottom };

      left += width + letterSpacing;
    }
  }

  ctx.restore();
}

function canvasHash(content: {
  text: string;
  font: string;
  width: number;
  dpr: number;
}) {
  return stableHash(content);
}
