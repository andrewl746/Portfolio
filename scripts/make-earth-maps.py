"""Make the maps the live Earth on the home page is drawn from.

The home page's Earth (lib/earth/renderer.ts) is ray traced in the browser,
the same way scripts/render-earth.py renders the Contact finale image: each
pixel's ray hits an Earth-sized sphere and is coloured from a map at that
latitude and longitude. These are the maps, all made from NASA's Black Marble
2016 with the same split into city lights and dark ground that
render-earth.py uses, so the live Earth and the finale image agree.

Inputs (public domain, NASA Earth Observatory "Black Marble 2016" colour maps,
https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/), kept
in the gitignored images-src/nasa-black-marble/:
  BlackMarble_2016_B1.jpg   500 m tile, 90°W–0°, 0°–90°N (decoded at 1 km)
  BlackMarble_2016_3km.jpg  3 km map of the whole globe

Usage (from the repo root; needs numpy and Pillow, and about 6 GB of memory):
  python -P scripts/make-earth-maps.py images-src/nasa-black-marble public/earth

Writes, as WebP with no metadata:
  map-base-2048.webp      the night side's ground for the whole globe: land,
                          ocean and snow, as the finale shades them
  map-night-4096.webp     city lights for the whole globe, on black
  map-night-2048.webp     the same at half size, for phones
  map-region-3840.webp    city lights for eastern North America, where the
                          camera spends its time (112°W–52°W, 8°N–62°N, at
                          1/64° per pixel)
  map-region-1920.webp    the same at half size, for phones
  map-day-2048.webp       daytime ground colour rebuilt from the night map's
                          dark base, for the sliver past the terminator;
                          alpha is land

Lights are stored brighter than they are (GAIN) so dim towns survive 8 bits;
the shader divides it back out. If GAIN or REGION change here, change them in
lib/earth/renderer.ts too.
"""
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

GAIN = 2.2
# West, east, south, north in degrees, and pixels per degree.
REGION = (-112.0, -52.0, 8.0, 62.0)
REGION_PPD = 64

LAND = np.array([8.0, 8.0, 17.0], np.float32)   # Black Marble land, sRGB 0-255
OCEAN = np.array([5.0, 5.0, 15.0], np.float32)  # Black Marble ocean


def srgb_to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c):
    c = np.clip(c, 0.0, None)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def light_weight(rgb):
    """How much of each pixel is city light: lights are warm (red well above
    blue); land, ocean and snow are blue."""
    lam = rgb[..., 0] - 0.55 * rgb[..., 2]
    return np.clip((lam - 4.0) / 30.0, 0.0, 1.0)


def resized(channel, size, how):
    return np.asarray(Image.fromarray(channel.astype(np.float32)).resize(size, how), np.float32)


def resized_rgb(a, size, how):
    return np.dstack([resized(a[..., i], size, how) for i in range(a.shape[-1])])


def as_bytes(a):
    return (np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)


def save(out, name, img, quality):
    path = out / name
    Image.fromarray(img).save(path, "WEBP", quality=quality, method=6)
    print(f"  {name}: {path.stat().st_size // 1024} KB")


def globe_maps(globe, out):
    """City lights and daytime colour for the whole globe, from the 3 km map."""
    w = light_weight(globe.astype(np.float32))
    night = {size: np.zeros((size[1], size[0], 3), np.float32) for size in ((4096, 2048), (2048, 1024))}
    dark = np.zeros((1024, 2048, 3), np.float32)
    for ch in range(3):
        c = globe[..., ch].astype(np.float32)
        lights = srgb_to_linear(np.clip(c - LAND[ch], 0.0, None) * w / 255.0).astype(np.float32)
        for size in night:
            night[size][..., ch] = resized(lights, size, Image.BOX)
        del lights
        ground = c * (1 - w) + LAND[ch] * w - OCEAN[ch]
        dark[..., ch] = resized(ground, (2048, 1024), Image.BOX)
        del ground, c
    del w
    for size, name in (((4096, 2048), "map-night-4096.webp"), ((2048, 1024), "map-night-2048.webp")):
        save(out, name, as_bytes(linear_to_srgb(night[size] * GAIN)), 88)
    # Daytime colour: undo the night map's blue tint and stretch what's left.
    d = np.clip(dark, 0.0, None)
    d[..., 2] /= 1.55
    land = np.clip((d.max(-1) - 0.5) / 1.0, 0.0, 1.0)
    albedo = np.clip(d / 44.0, 0.0, 1.0) ** 0.85
    save(out, "map-day-2048.webp", as_bytes(np.dstack([albedo, land])), 86)


def base_map(globe, out):
    """The night side's ground for the whole globe, as the finale shades it."""
    c = globe.astype(np.float32)
    w = light_weight(c)[..., None]
    base = c * (1 - w) + LAND * w
    # Lift land slightly off the ocean (as faint moonlight would) and compress
    # the bright Arctic snow so it doesn't glare at the horizon.
    dv = np.clip(base - OCEAN, 0.0, None) * 2.6
    base = OCEAN + dv / (1.0 + dv / 26.0)
    del c, w, dv
    small = resized_rgb(base, (2048, 1024), Image.BOX)
    save(out, "map-base-2048.webp", np.clip(small + 0.5, 0, 255).astype(np.uint8), 90)


def lights_of(rgb):
    c = rgb.astype(np.float32)
    w = light_weight(c)[..., None]
    return srgb_to_linear(np.clip(c - LAND, 0.0, None) * w / 255.0).astype(np.float32)


def region_maps(globe, src, out):
    """City lights for eastern North America: the 500 m tile east of 90°W, the
    3 km map west of it."""
    lon0, lon1, lat0, lat1 = REGION
    ppd = REGION_PPD
    W, H = round((lon1 - lon0) * ppd), round((lat1 - lat0) * ppd)
    gh, gw = globe.shape[:2]
    x0, x1 = round((lon0 + 180) / 360 * gw), round((lon1 + 180) / 360 * gw)
    y0, y1 = round((90 - lat1) / 180 * gh), round((90 - lat0) / 180 * gh)
    region = resized_rgb(lights_of(globe[y0:y1, x0:x1]), (W, H), Image.BILINEAR)

    # The 500 m tile decoded at half size is exactly 1/120° per pixel.
    b1 = Image.open(src / "BlackMarble_2016_B1.jpg")
    b1.draft("RGB", (b1.width // 2, b1.height // 2))
    b1 = b1.convert("RGB")
    tile_ppd = b1.width / 90.0
    box = (0, round((90 - lat1) * tile_ppd), round((lon1 + 90) * tile_ppd), round((90 - lat0) * tile_ppd))
    tile = lights_of(np.asarray(b1.crop(box)))
    del b1
    tw = round((lon1 + 90) * ppd)
    tile = resized_rgb(tile, (tw, H), Image.BOX)
    # Fade from the 3 km map into the tile over its first degree, so there's
    # no seam at 90°W.
    ox = round((-90 - lon0) * ppd)
    lons = -90 + (np.arange(tw) + 0.5) / ppd
    ramp = np.clip((lons + 90.0) / 1.0, 0.0, 1.0)[None, :, None].astype(np.float32)
    region[:, ox:ox + tw] = region[:, ox:ox + tw] * (1 - ramp) + tile * ramp
    del tile

    img = Image.fromarray(as_bytes(linear_to_srgb(region * GAIN)))
    img.save(out / f"map-region-{W}.webp", "WEBP", quality=86, method=6)
    print(f"  map-region-{W}.webp: {(out / f'map-region-{W}.webp').stat().st_size // 1024} KB")
    half = img.resize((W // 2, H // 2), Image.BOX)
    half.save(out / f"map-region-{W // 2}.webp", "WEBP", quality=88, method=6)
    print(f"  map-region-{W // 2}.webp: {(out / f'map-region-{W // 2}.webp').stat().st_size // 1024} KB")


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    globe = np.asarray(Image.open(src / "BlackMarble_2016_3km.jpg").convert("RGB"))
    print(f"3 km map {globe.shape[1]}x{globe.shape[0]}, {time.time() - t0:.1f}s")
    globe_maps(globe, out)
    base_map(globe, out)
    region_maps(globe, src, out)
    print(f"done, {time.time() - t0:.1f}s")


if __name__ == "__main__":
    main()
