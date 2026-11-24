"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

// How wide the card shows it: beside the words on wide screens, under them
// on narrower ones, the full width on a phone.
const SIZES = "(min-width: 1280px) 720px, (min-width: 768px) 656px, 100vw";
/** Once a screenshot has arrived it may take this long to decode before it is
 *  shown anyway, ms. */
const DECODE_MOST = 400;
/** How long after the original file failed it is asked for once more, ms. */
const RETRY_AFTER = 1500;

/**
 * A project's screenshot.
 *
 * It is fetched with the page, not when it is scrolled to, and it stays out
 * of sight until all of it has arrived and decoded (data-shot, and .shot in
 * globals.css). A browser can then never have it on screen half-loaded:
 * Safari drew one from the part of the file it had, a flat grey box, and
 * kept that after the rest had come. For the same reason it is decoded in
 * step with the page (decoding="sync"), which throws a half-made picture away
 * where decoding on the side keeps it until a whole one replaces it.
 *
 * data-shot says where it has got to: "wait" as the server sent it, "loading"
 * once this is watching it, then "ready", or "failed" when it can't be had.
 * The opening waits for every screenshot to settle (lib/earth/coast.ts).
 *
 * If the resized copy can't be fetched the original file is used, and asked
 * for once more if that fails too. After that its description shows in its
 * place.
 */
export default function ProjectShot({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLImageElement>(null);
  // 0: the resized copy. 1: the original file. 2: the original, once more.
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<"wait" | "loading" | "ready" | "failed">("wait");

  useEffect(() => {
    const img = ref.current;
    if (!img) return;
    let settled = false;
    let timer = 0;
    setState("loading");
    const show = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      setState("ready");
    };
    const failed = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (attempt === 0) setAttempt(1);
      else if (attempt === 1) timer = window.setTimeout(() => setAttempt(2), RETRY_AFTER);
      else setState("failed");
    };
    const arrived = () => {
      // Arrived, but not a picture.
      if (!img.naturalWidth) return failed();
      // Decoded before it is shown, so its first frame on screen is whole. A
      // browser that takes its time over that (some hold it back in a
      // background tab) doesn't keep the picture hidden. One that says it
      // can't decode it gets the next source; from the last source the
      // picture is shown all the same, for the browser to draw what it can.
      timer = window.setTimeout(show, DECODE_MOST);
      if (typeof img.decode === "function") img.decode().then(show, attempt < 2 ? failed : show);
      else show();
    };
    // It may have arrived, or failed, before this ran.
    if (img.complete) arrived();
    else {
      img.addEventListener("load", arrived);
      img.addEventListener("error", failed);
    }
    return () => {
      settled = true;
      window.clearTimeout(timer);
      img.removeEventListener("load", arrived);
      img.removeEventListener("error", failed);
    };
  }, [attempt]);

  // It can't be had: its description stands in its place, in the same frame.
  // (A browser's own stand-in for a broken picture loses the frame's shape.)
  if (state === "failed") {
    return (
      <p
        data-shot="failed"
        className="flex aspect-[16/10] w-full items-center justify-center border border-white/10 p-6 text-center text-xs leading-relaxed text-dim"
      >
        {alt}
      </p>
    );
  }

  const resized = getImageProps({ src, alt, width: 1280, height: 800, sizes: SIZES, quality: 90 }).props;
  return (
    // A new element for each source, so nothing of a failed one is left on
    // it. `src` comes last: Safari starts fetching it the moment it is set,
    // before it has seen `sizes` and `srcSet`.
    // eslint-disable-next-line @next/next/no-img-element -- the resized copies still come from next/image (getImageProps); this needs the element itself
    <img
      key={attempt}
      ref={ref}
      alt={alt}
      width={1280}
      height={800}
      loading="eager"
      decoding="sync"
      data-shot={state}
      className="shot block w-full border border-white/10"
      sizes={attempt === 0 ? resized.sizes : undefined}
      srcSet={attempt === 0 ? resized.srcSet : undefined}
      src={attempt === 0 ? resized.src : attempt === 1 ? src : `${src}?retry=1`}
    />
  );
}
