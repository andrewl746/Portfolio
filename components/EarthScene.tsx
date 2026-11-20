"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { EARTH_DESKTOP, EARTH_MOBILE, type EarthFrame } from "@/lib/earth-scene";
import { startCoast } from "@/lib/earth/coast";

// Landscape screens get the wide finale render; portrait ones (phones,
// portrait tablets) get the tall one. Keep in sync with the .scene-plate
// rules in globals.css and finaleFrame() in lib/earth/view.ts.
const WIDE = "(orientation: landscape)";
const LAYERS = ["surface", "lights", "atmosphere"] as const;

// The two renders' shapes, for the frame the image fills (.scene-plate-frame).
const RATIOS = {
  "--plate-wide": `${EARTH_DESKTOP.width} / ${EARTH_DESKTOP.height}`,
  "--plate-tall": `${EARTH_MOBILE.width} / ${EARTH_MOBILE.height}`,
} as CSSProperties;

const srcSet = (frame: EarthFrame, layer: string, format: "avif" | "webp") =>
  frame.widths.map((w) => `/earth/earth-${frame.name}-${layer}-${w}.${format} ${w}w`).join(", ");

function Pin({ frame, className }: { frame: EarthFrame; className: string }) {
  if (!frame.waterloo) return null;
  return (
    <span
      className={`scene-pin ${className}`}
      style={{ left: `${frame.waterloo.x * 100}%`, top: `${frame.waterloo.y * 100}%` }}
    >
      <span className="scene-pin-dot" />
      <span className="scene-pin-label">Waterloo</span>
    </span>
  );
}

/**
 * The Earth the whole page is built around (lib/earth): the
 * live planet drawn over the page, its satellites on a canvas over that, and
 * the rendered Contact finale image
 * (scripts/render-earth.py) that the live Earth's last frame hands over to.
 *
 * It finds the page's own elements by their data-scene attributes, inside
 * the nearest .coast (app/page.tsx).
 */
export default function EarthScene() {
  const earthRef = useRef<HTMLCanvasElement>(null);
  const faceRef = useRef<HTMLCanvasElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  // The finale image is only fetched once the reader is past halfway (or at
  // once, when it stands in for the live Earth).
  const [plateWanted, setPlateWanted] = useState(false);

  useEffect(() => {
    const earth = earthRef.current;
    const face = faceRef.current;
    const plate = plateRef.current;
    const root = earth?.closest<HTMLElement>(".coast");
    if (!earth || !face || !plate || !root) return;
    return startCoast({ root, earth, face, plate, needPlate: () => setPlateWanted(true) });
  }, []);

  return (
    <>
      <canvas ref={earthRef} aria-hidden="true" className="scene-layer scene-earth" />
      <div ref={plateRef} aria-hidden="true" className="scene-plate">
        <div className="scene-plate-frame" style={RATIOS}>
        {plateWanted &&
          LAYERS.map((layer) => (
            <picture key={layer}>
              <source media={WIDE} type="image/avif" srcSet={srcSet(EARTH_DESKTOP, layer, "avif")} sizes="100vw" />
              <source media={WIDE} type="image/webp" srcSet={srcSet(EARTH_DESKTOP, layer, "webp")} sizes="100vw" />
              <source type="image/avif" srcSet={srcSet(EARTH_MOBILE, layer, "avif")} sizes="100vw" />
              <img
                src={`/earth/earth-mobile-${layer}-${EARTH_MOBILE.widths[0]}.webp`}
                srcSet={srcSet(EARTH_MOBILE, layer, "webp")}
                sizes="100vw"
                alt=""
                decoding="async"
                draggable={false}
              />
            </picture>
          ))}
        <Pin frame={EARTH_DESKTOP} className="only-wide" />
        <Pin frame={EARTH_MOBILE} className="only-tall" />
        </div>
      </div>
      <canvas ref={faceRef} aria-hidden="true" className="scene-layer scene-face" />
      {/* Shows only when the first screen takes a while to load. */}
      <div aria-hidden="true" className="scene-loading">
        <span className="scene-loading-line">
          <span />
        </span>
        <span className="scene-loading-text">
          <span data-load="what">Loading</span>
          <span data-load="pct">0%</span>
        </span>
      </div>
    </>
  );
}
