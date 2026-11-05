# Earth finale

The night side of Earth under the Contact section, with a satellite crossing the limb. It's real data seen from a real camera position, so keep it that way when changing it.

## How it's made

`scripts/render-earth.py` ray traces the image. Each pixel is a ray from a camera 2,000 km above the Bahamas looking north-north-east. That's the wide framing, used on landscape screens; the tall framing for portrait screens (phones, portrait tablets) is from 3,000 km. It's intersected with an Earth-sized sphere and coloured from NASA's Black Marble 2016 map of city lights at the exact latitude and longitude it hits. Curvature, foreshortening, and the dimming and reddening of lights toward the horizon all come from that geometry.

- **Sun:** placed for a pre-dawn summer night (subsolar point 18°N, 80°E). Everything in view is dark, but over the north-east horizon the Sun is about 5° below the horizon. The air there is lit from below, which makes the thin warm and blue band on that part of the limb.
- **Hero satellite:** a circular 550 km, 53° orbit (Starlink's main shell). It moves eastward, so from this camera it travels away, crosses the limb and sets behind the Earth. It looks dim while in Earth's shadow and brightens (with a glint) when it reaches sunlight.
- **Background traffic:** three faint satellites on real shell inclinations (Starlink and OneWeb), with no orbit lines.
- **Waterloo pin:** projected from Waterloo's coordinates with the same camera.

The script writes three layers per framing (`surface`, `lights`, `atmosphere`) to `public/earth/` as AVIF and WebP at a few widths. It also writes `lib/earth-scene.ts` with the camera, Sun and orbits. `components/EarthFinale.tsx` reads that file to draw the orbit and satellites in exactly the image's projection, so never edit it by hand.

## Regenerating

1. Download the two NASA files into `images-src/nasa-black-marble/` (gitignored) from <https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/> (2016 Color):
   - `BlackMarble_2016_B1.jpg`: 500 m tile, 90°W to 0°, 0° to 90°N, 29.5 MB
   - `BlackMarble_2016_3km.jpg`: the 3 km global map, 8.1 MB
2. Run from the repo root (needs numpy and Pillow with AVIF support):

   ```bash
   python -P scripts/render-earth.py images-src/nasa-black-marble public/earth lib/earth-scene.ts
   ```

   Add `--preview <dir>` for a low-res render in a couple of seconds, and `--check <dir>` to also write flattened full-size composites to look at. A full render takes about a minute.
3. The scene lives in the constants at the top of the script: `FRAMES` (camera, orbit plane), `SUN_LAT`/`SUN_LON`, `ORBIT_ALT`/`ORBIT_INC`. If you move the camera, check that the orbit still crosses the frame, rises over the limb and sets behind it (the preview draws the pass), and that no ground in view is in daylight.

## Layout

Contact and the Earth form the last screen (`.contact-scene` in `app/page.tsx`). Together they're at least one viewport tall, less the offset the nav scrolls to (Contact's `scroll-mt`). So clicking Contact, or opening `/#contact`, lands at the end of the page with the whole scene on screen.

- **Pinned to the bottom:** the rendered frame keeps its aspect ratio and sits at the bottom of the Earth's area.
- **Short screens:** the frame first gives up the empty sky above the satellite's arc. Below that it can trim up to 12% off its near side under the footer (`BOTTOM_KEEP` in `EarthFinale.tsx`). Contact's top padding also tightens below 860 px of height.
- **Tall screens:** extra height just adds sky.
- **Tiny screens:** where it still doesn't fit (e.g. a phone with both browser bars showing), the Earth finishes rising where the Contact jump lands (`settleWith`), so it's never caught half-risen.

## Motion

- **Rise:** the Earth follows the scroll (18% rise, slight zoom), easing toward the scroll position with a 0.14 s time constant, so it glides and settles in about half a second. It waits for its images, so after a jump to Contact the rise still plays in view instead of happening while they load.
- **Lights and atmosphere:** they fade up as it settles.
- **Orbit and satellite:** once the Earth is mostly in view, the orbit draws in with the site's strong ease-out, `cubic-bezier(0.23, 1, 0.32, 1)`. The satellite sets off at the same moment, from the start of the arc, so something is moving as soon as the orbit appears (the line races ahead of it). Its 15 s pass runs at constant orbital speed. Perspective makes it fast near the camera and slow at the horizon. As it sets, it dims and reddens through the atmosphere, and its trail follows it down behind the limb.
- **Reduced motion:** devices set to reduce motion get the settled frame with the satellite at the top of its arc and nothing moving.
- **Pausing:** the animation runs only while the Earth is on screen and the tab is visible.

Credit: city lights from NASA Earth Observatory's Black Marble 2016 (Suomi NPP VIIRS), public domain. The caption on the page credits it.
