# The Earth

The home page is one flight. A live Earth is drawn over the page from the first screen to the last: the name stands behind its limb, sets behind it as you scroll, each section rises from behind it, and the camera ends on the view over eastern North America that the Contact section stands in. It's real data seen from a real camera position, so keep it that way when changing it.

## What draws it

There are two Earths that have to agree.

- **The live Earth** (`lib/earth/renderer.ts`): a WebGL2 shader that ray traces the planet in the browser from any camera position. Each pixel is a ray from the camera. Where it hits an Earth-sized sphere, it's coloured from NASA's Black Marble 2016 city lights at that latitude and longitude. Curvature, foreshortening, and the dimming and reddening of lights toward the horizon all come from that geometry.
- **The finale image** (`scripts/render-earth.py`): the same thing rendered ahead of time, at higher quality, from the one camera the page ends on. It fades in over the live Earth's last frame, pixel for pixel.

The shader is a port of the script (same atmosphere, twilight and extinction maths). If you change one, change the other, or the hand-over at the end of the page will show a jump.

Details the two share:

- **Sun:** at the end of the page it's placed for a pre-dawn summer night (subsolar point 18°N, 80°E). Everything in view is dark, but over the north-east horizon the Sun is about 5° below the horizon. The air there is lit from below, which makes the thin warm and blue band on that part of the limb. Up the page it's earlier: the Sun starts at 143°E (dusk on the first screen) and moves with the scroll.
- **Hero satellite:** a circular 550 km, 53° orbit (Starlink's main shell). Six satellites share it, so one is always crossing. Each looks dim while in Earth's shadow and glints as it comes out into sunlight.
- **Background traffic:** faint satellites on real shell inclinations (Starlink and OneWeb). Three more shells fade in while you read and clear before the finale.
- **Waterloo pin:** projected from Waterloo's coordinates with the finale's camera. It belongs to the finale image.

## The flight

`lib/earth/coast.ts` decides where the camera is for each scroll position, and `lib/earth/stage.ts` runs it.

- **First screen:** off Newfoundland at 2,700 km, looking south-west down the lit coast. The name is as wide as the screen and stands behind the limb. Its size and the horizon's height are worked out from how much room the text around it needs (`heroLayout`), so nothing is fixed to one screen size.
- **Reading:** the horizon sinks to one steady height (84% of the window on landscape screens, 87% on portrait) and stays there. It gives way toward 90% only where a short window would leave a whole project too little room. The camera swings out over the Atlantic and south to the Caribbean, about 3,000 km off the seaboard and always looking back at it, because only a strip of the Earth shows while reading and a strip is the far horizon. That keeps the city lights on it through every section (`ROUTE`, `LOOK`).
- **Last screen:** the camera comes in over Florida onto the finale's view and the finale image fades in. On a short window the whole finale sits a little lower, so the Earth stays 20 px under the last line of Contact.

## Layers

The Earth is drawn over the page, which is what lets things set behind it. Back to front (the list is also at the top of the home page's styles in `app/globals.css`):

1. Stars (`components/Starfield.tsx`, still on this page)
2. The name
3. Satellites over the sky
4. The page's content
5. The Earth, and the finale image over its last frame
6. Satellites crossing the Earth's face
7. The first screen's text, the footer, the bar

Satellites are split across two canvases (3 and 6) so one passes behind a screenshot and still crosses the planet in front. Nothing between the stars and the bar may form a stacking context (no `transform`, `opacity`, `filter` or `z-index` on a wrapper), or the Earth can no longer pass between a section and the sky behind it.

`components/EarthScene.tsx` holds the canvases and starts the scene. The scene finds the page's own elements by their `data-scene` attributes: `name`, `pin`, `hero`, `hero-top`, `hero-band`, `page`, `end`, `project` and `contact-last`. If you rename or remove one, the scene has nothing to measure.

## When things are missing

- **No WebGL2:** the finale image stands in for the live Earth all the way down the page, level, sinking to the same floor while you read and coming back up for Contact. The satellites still line up with it. The first screen is laid out a little differently for it (`data-gl="off"` in the styles).
- **Reduced motion:** nothing moves by itself. The scene holds one moment and only redraws as you scroll.
- **A slow graphics chip:** scrolling redraws the whole Earth every frame. If those frames run well behind the ones where only satellites move, the Earth drops a step in sharpness, twice at most, and stays there (`pace` in `stage.ts`).
- **Phones and tablets:** they load the half-size maps, about half a megabyte less and a quarter of the graphics memory. The finale image is only fetched once the reader is past halfway.
- **A font that sets the name wider than Fraunces** (a fallback while it loads, or a browser that draws it differently): the name is brought in until it fits the window.
- **The scene never starts, or no JS:** the name and the first screen's text show themselves (after a few seconds, or at once without JS) and scroll with the page.

## Regenerating

1. Download the two NASA files into `images-src/nasa-black-marble/` (gitignored) from <https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/> (2016 Color):
   - `BlackMarble_2016_B1.jpg`: 500 m tile, 90°W to 0°, 0° to 90°N, 29.5 MB
   - `BlackMarble_2016_3km.jpg`: the 3 km global map, 8.1 MB
2. The finale image, from the repo root (needs numpy and Pillow with AVIF support):

   ```bash
   python -P scripts/render-earth.py images-src/nasa-black-marble public/earth lib/earth-scene.ts
   ```

   It writes three layers per framing (`surface`, `lights`, `atmosphere`) to `public/earth/` as AVIF and WebP at a few widths: a wide framing from 2,000 km for landscape screens and a tall one from 3,000 km for portrait screens. It also writes `lib/earth-scene.ts` with the camera, Sun and orbits. The live Earth reads that file to land on exactly the image's view, so never edit it by hand. Add `--preview <dir>` for a low-res render in a couple of seconds, and `--check <dir>` to also write flattened full-size composites to look at. A full render takes about a minute.
3. The live Earth's maps (needs numpy and Pillow, and about 6 GB of memory):

   ```bash
   python -P scripts/make-earth-maps.py images-src/nasa-black-marble public/earth
   ```

   It writes the six `map-*.webp` files: the night side's ground, city lights for the globe and (sharper) for eastern North America, each also at half size for phones, and daytime colour for the sliver past the terminator.
4. The finale's scene lives in the constants at the top of `render-earth.py`: `FRAMES` (camera, orbit plane), `SUN_LAT`/`SUN_LON`, `ORBIT_ALT`/`ORBIT_INC`. If you move the camera, check that the orbit still crosses the frame, rises over the limb and sets behind it (the preview draws the pass), and that no ground in view is in daylight.

## Changing it

- **The name or the heading typeface:** the name's place on the limb is measured from Fraunces at its display size (`CAPS`, `BASELINE`, `SUNK` at the top of `coast.ts`, and the `0.245` that sets its width). Another name or face needs those measured again.
- **How high the Earth sits while reading:** `floorAt` in `coast.ts`.
- **Where the camera goes:** `ROUTE` and `LOOK` in `coast.ts`. Look at the strip of Earth in every section afterwards. It's easy to end up looking past the lights at dark ocean.
- **Checking a change:** look at a laptop size and a phone size, scroll the whole page, and try it once with WebGL off and once with reduced motion. The scene's loop is built so one bad frame can't freeze it, but the console will say if a frame failed.

Credit: city lights from NASA Earth Observatory's Black Marble 2016 (Suomi NPP VIIRS), public domain. The caption on the page credits it.
