"""Render the night side of Earth for the finale under the Contact section.

The Earth is ray traced from a real camera position: every pixel is a ray
from a point 2,000+ km above the Atlantic, intersected with a sphere the size
of Earth, and coloured from NASA's map of city lights at the exact latitude
and longitude it hits. The curvature, the foreshortening toward the horizon
and the dimming and reddening of lights near the limb all fall out of that
geometry.

Inputs (public domain, NASA Earth Observatory "Black Marble 2016" colour maps,
https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/), kept
in the gitignored images-src/nasa-black-marble/:
  BlackMarble_2016_B1.jpg   500 m tile, 90°W–0°, 0°–90°N (decoded at 1 km)
  BlackMarble_2016_3km.jpg  3 km map of the whole globe, for everything else

Usage (from the repo root; needs numpy and Pillow):
  python -P scripts/render-earth.py images-src/nasa-black-marble public/earth lib/earth-scene.ts
  python -P scripts/render-earth.py ... --preview <dir>   quick low-res render

Writes, for a desktop and a phone framing, three layers with transparent sky
(surface, city lights, atmosphere) as AVIF and WebP at a few widths each, and
lib/earth-scene.ts with the camera, sun and orbits used, so the page draws
the orbit and satellites in exactly the same projection as the image.
"""
import argparse
import math
import time
from pathlib import Path

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

RE = 6371.0  # mean Earth radius, km

# --- Scene -----------------------------------------------------------------

# Sun: a pre-dawn summer night (subsolar point 18°N, 80°E, around 1:20 am
# local time under the camera). Everything the camera sees is in darkness,
# but along the north-east horizon the Sun is only ~5° below the horizon, so
# the air above it is lit from below: the thin glow on that part of the limb.
SUN_LAT, SUN_LON = 18.0, 80.0

# A circular low Earth orbit at Starlink's shell height and inclination.
# Satellites go round prograde (eastward), so seen from a camera looking
# north-east they travel away from it, rise over the limb and set behind it.
ORBIT_ALT, ORBIT_INC = 550.0, 53.0

FRAMES = {
    # Wide frame for the desktop layout. The camera is 2,000 km above the
    # Bahamas looking north-north-east: the East Coast and Great Lakes lights
    # fill the lower left, the Atlantic is dark on the right, and the limb
    # runs across the upper middle.
    "desktop": dict(
        width=2800, height=1300, widths=(1400, 2000, 2800),
        lat=25.0, lon=-80.5, alt=2000.0, heading=15.0, pitch=41.0,
        hfov=64.0, shift=-0.04, raan=-122.0,
    ),
    # Tall frame for phones: higher up and narrower, so the limb still shows
    # its curve across a 390 px wide screen, tilted down so the planet fills
    # the lower 60% of the frame (Florida up to New England).
    "mobile": dict(
        width=1200, height=1300, widths=(800, 1200),
        lat=25.0, lon=-80.5, alt=3000.0, heading=15.0, pitch=50.5,
        hfov=58.0, shift=-0.08, raan=-116.0,
    ),
}

WATERLOO = (43.4643, -80.5204)


# --- Geometry --------------------------------------------------------------

def unit(v):
    return v / np.linalg.norm(v, axis=-1, keepdims=True)


def ecef(lat, lon, r=1.0):
    la, lo = np.radians(lat), np.radians(lon)
    return r * np.stack([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)], axis=-1)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


class Camera:
    """Pinhole camera above the Earth. Heading is degrees clockwise from
    north, pitch is degrees below the local horizontal."""

    def __init__(self, lat, lon, alt, heading, pitch, hfov, width, height, shift=0.0, **_):
        self.C = ecef(lat, lon, RE + alt)
        up0 = unit(self.C)
        east = unit(np.cross([0.0, 0.0, 1.0], up0))
        north = np.cross(up0, east)
        hd, pt = math.radians(heading), math.radians(pitch)
        horiz = math.cos(hd) * north + math.sin(hd) * east
        self.fwd = unit(math.cos(pt) * horiz - math.sin(pt) * up0)
        self.right = unit(np.cross(self.fwd, up0))
        self.up = np.cross(self.right, self.fwd)
        self.W, self.H = width, height
        self.f = (width / 2) / math.tan(math.radians(hfov) / 2)
        self.cx = width / 2
        self.cy = height / 2 + shift * height

    def rays(self, xs, ys):
        d = (self.fwd[None, :]
             + ((xs - self.cx) / self.f)[:, None] * self.right[None, :]
             - ((ys - self.cy) / self.f)[:, None] * self.up[None, :])
        return unit(d)

    def project(self, P):
        v = P - self.C
        z = v @ self.fwd
        return self.cx + self.f * (v @ self.right) / z, self.cy - self.f * (v @ self.up) / z, z


def sphere_hit(C, d):
    """Distance along unit rays d from C to the Earth's surface (nan = miss)."""
    b = d @ C
    disc = b * b - (C @ C - RE * RE)
    t = -b - np.sqrt(np.maximum(disc, 0.0))
    return np.where((disc > 0) & (t > 0), t, np.nan)


def orbit_basis(raan, inc):
    """Ascending node and the in-plane vector 90° ahead of it."""
    O, i = math.radians(raan), math.radians(inc)
    node = np.array([math.cos(O), math.sin(O), 0.0])
    ahead = np.array([-math.cos(i) * math.sin(O), math.cos(i) * math.cos(O), math.sin(i)])
    return node, ahead


def orbit_points(raan, u, inc=ORBIT_INC, alt=ORBIT_ALT):
    node, ahead = orbit_basis(raan, inc)
    r = RE + alt
    return r * (np.cos(u)[:, None] * node + np.sin(u)[:, None] * ahead)


def occluded(C, P):
    """True where the Earth blocks the line of sight from C to points P."""
    v = P - C
    dist = np.linalg.norm(v, axis=-1)
    d = v / dist[:, None]
    t = sphere_hit(C, d)
    return np.isfinite(t) & (t < dist)


def sunlit(P, S, soft=40.0):
    """1 in sunlight, 0 in Earth's shadow (cylindrical, soft-edged)."""
    s = P @ S
    perp = np.linalg.norm(P - s[:, None] * S[None, :], axis=-1)
    return np.where(s > 0, 1.0, smoothstep(RE - soft, RE + soft, perp))


# --- Texture ---------------------------------------------------------------

LAND = np.array([8.0, 8.0, 17.0])    # Black Marble land, sRGB 0-255
OCEAN = np.array([5.0, 5.0, 15.0])   # Black Marble ocean


def srgb_to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c):
    c = np.clip(c, 0.0, None)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


class Texture:
    """A lat/lon window of the night map, split into a dark base (land, ocean,
    snow) and the city lights, each with a mip pyramid so distant ground is
    averaged instead of sparkling."""

    def __init__(self, src, bounds, res, preview):
        self.lat0, self.lat1, self.lon0, self.lon1 = bounds
        self.res = res
        W = round((self.lon1 - self.lon0) / res)
        H = round((self.lat1 - self.lat0) / res)
        t0 = time.time()

        g = Image.open(src / "BlackMarble_2016_3km.jpg")
        if preview:
            g.draft("RGB", (g.width // 2, g.height // 2))
        g = g.convert("RGB")
        gres = 360.0 / g.width
        box = ((self.lon0 + 180) / gres, (90 - self.lat1) / gres,
               (self.lon1 + 180) / gres, (90 - self.lat0) / gres)
        rgb = np.array(g.transform((W, H), Image.EXTENT, box, Image.BILINEAR), np.uint8)
        del g

        if not preview:
            # The 500 m tile decoded at half size is exactly 1/120° per pixel.
            b1 = Image.open(src / "BlackMarble_2016_B1.jpg")
            b1.draft("RGB", (b1.width // 2, b1.height // 2))
            b1 = b1.convert("RGB")
            bres = 90.0 / b1.width
            lo0, lo1 = max(self.lon0, -90.0), min(self.lon1, 0.0)
            la0, la1 = max(self.lat0, 0.0), min(self.lat1, 90.0)
            x0 = round((lo0 - self.lon0) / res)
            x1 = round((lo1 - self.lon0) / res)
            y0 = round((self.lat1 - la1) / res)
            y1 = round((self.lat1 - la0) / res)
            box = ((lo0 + 90) / bres, (90 - la1) / bres, (lo1 + 90) / bres, (90 - la0) / bres)
            tile = np.asarray(b1.transform((x1 - x0, y1 - y0), Image.EXTENT, box, Image.BILINEAR))
            del b1
            # Fade from the 3 km map into the tile over its first degree, so
            # there's no seam at 90°W.
            lons = lo0 + (np.arange(x1 - x0) + 0.5) * res
            w = np.clip((lons + 90.0) / 1.0, 0.0, 1.0)[None, :, None].astype(np.float32)
            for r in range(y0, y1, 512):
                r2 = min(y1, r + 512)
                mixed = rgb[r:r2, x0:x1] * (1 - w) + tile[r - y0:r2 - y0] * w
                rgb[r:r2, x0:x1] = np.clip(mixed + 0.5, 0, 255).astype(np.uint8)
            del tile

        # Split lights from the dark base, a band of rows at a time.
        self.base = [np.empty((H, W, 3), np.uint8)]
        self.lights = [np.empty((H, W, 3), np.float16)]
        for r in range(0, H, 512):
            c = rgb[r:r + 512].astype(np.float32)
            # Lights are warm (red well above blue); land, ocean and snow are blue.
            lam = c[..., 0] - 0.55 * c[..., 2]
            w = np.clip((lam - 4.0) / 30.0, 0.0, 1.0)[..., None]
            lights = np.clip(c - LAND, 0.0, None) * w
            base = c * (1 - w) + LAND * w
            # Lift land slightly off the ocean (as faint moonlight would) and
            # compress the bright Arctic snow so it doesn't glare at the horizon.
            dv = np.clip(base - OCEAN, 0.0, None) * 2.6
            base = OCEAN + dv / (1.0 + dv / 26.0)
            self.base[0][r:r + 512] = np.clip(base + 0.5, 0, 255).astype(np.uint8)
            self.lights[0][r:r + 512] = srgb_to_linear(lights / 255.0).astype(np.float16)
        del rgb
        while min(self.base[-1].shape[:2]) > 8:
            self.base.append(self._half(self.base[-1]))
            self.lights.append(self._half(self.lights[-1]))
        print(f"  texture {W}x{H}, {len(self.base)} levels, {time.time() - t0:.1f}s")

    @staticmethod
    def _half(a):
        H, W = a.shape[:2]
        dtype = a.dtype
        a = a[: H - H % 2, : W - W % 2].astype(np.float32)
        out = (a[0::2, 0::2] + a[1::2, 0::2] + a[0::2, 1::2] + a[1::2, 1::2]) / 4
        return np.clip(out + 0.5, 0, 255).astype(np.uint8) if dtype == np.uint8 else out.astype(np.float16)

    @staticmethod
    def _bilinear(img, u, v):
        H, W = img.shape[:2]
        u = np.clip(u, 0, W - 1.001)
        v = np.clip(v, 0, H - 1.001)
        x0 = u.astype(np.int32)
        y0 = v.astype(np.int32)
        fx = (u - x0)[:, None]
        fy = (v - y0)[:, None]
        a = img[y0, x0].astype(np.float32)
        b = img[y0, x0 + 1].astype(np.float32)
        c = img[y0 + 1, x0].astype(np.float32)
        d = img[y0 + 1, x0 + 1].astype(np.float32)
        return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy

    def sample(self, lat, lon, mip):
        """Trilinear lookup. Returns base (sRGB 0-1) and lights (linear)."""
        u = (lon - self.lon0) / self.res - 0.5
        v = (self.lat1 - lat) / self.res - 0.5
        top = len(self.base) - 1
        mip = np.clip(mip, 0, top)
        k0 = np.floor(mip).astype(np.int32)
        t = (mip - k0)[:, None]
        base = np.zeros((lat.size, 3), np.float32)
        lights = np.zeros((lat.size, 3), np.float32)
        for k in np.unique(k0):
            m = k0 == k
            for level, wt in ((k, 1 - t[m]), (min(k + 1, top), t[m])):
                s = 2.0 ** level
                uu = (u[m] + 0.5) / s - 0.5
                vv = (v[m] + 0.5) / s - 0.5
                base[m] += self._bilinear(self.base[level], uu, vv) * wt
                lights[m] += self._bilinear(self.lights[level], uu, vv) * wt
        return base / 255.0, lights


# --- Atmosphere --------------------------------------------------------------

BLUE = srgb_to_linear(np.array([95, 165, 255]) / 255.0)    # the banner's limb blue
WARM = srgb_to_linear(np.array([255, 150, 95]) / 255.0)    # low twilight layer
AIRGLOW = srgb_to_linear(np.array([150, 255, 170]) / 255.0)


def atmosphere(C, d, hit, S):
    """Light scattered toward the camera along each ray, linear RGB.

    Uses the ray's tangent point (where it passes closest to the Earth): its
    altitude says how much air the ray crosses, and the Sun's depression
    below the horizon there says whether that air is still in sunlight."""
    b = d @ C
    tc = -b
    Pc = C + tc[:, None] * d
    rc = np.linalg.norm(Pc, axis=-1)
    ht = rc - RE                                      # tangent altitude, km
    cosz = (Pc / rc[:, None]) @ S
    beta = np.arcsin(np.clip(-cosz, -1.0, 1.0))       # sun depression, rad
    shadow = np.where(cosz < 0, RE * (1 / np.cos(np.clip(beta, 0, 1.4)) - 1), 0.0)
    ahead = tc > 0

    # Twilight: air above the shadow line catches sunlight. How bright it
    # looks follows how much air the ray crosses at that height, so the glow
    # sits just above the shadow line and dies out where the shadow line is
    # high (the Sun far below the horizon): only the stretch of limb toward
    # the Sun lights up.
    above = ht - shadow
    lit = smoothstep(-3.0, 8.0, above)
    h = np.clip(ht, 0, None)
    band = lit * (np.exp(-h / 11.0) * 3.2 + np.exp(-h / 32.0) * 0.45)
    tint = smoothstep(3.0, 24.0, above)[:, None]
    twilight = band[:, None] * (WARM * (1 - tint) * 0.6 + BLUE * tint)

    # A faint limb all the way round (airglow and starlight on the air) and
    # the thin green oxygen airglow layer near 95 km, kept very faint.
    limb = np.exp(-np.abs(ht) / 7.0) * 0.10 + np.exp(-np.abs(ht) / 40.0) * 0.035
    green = np.exp(-(((ht - 95.0) / 5.5) ** 2)) * 0.018

    glow = twilight + limb[:, None] * BLUE + green[:, None] * AIRGLOW
    # Below the limb, the same air sits in front of the ground: fade it out
    # with depth so it reads as haze along the horizon.
    under = np.isfinite(hit)
    glow[under] *= np.exp(np.clip(ht[under], None, 0) / 45.0)[:, None]
    glow[~ahead] = 0.0
    return glow


# --- Rendering ---------------------------------------------------------------

def extinction(cos_i):
    """Atmospheric transmission of light leaving the surface toward the
    camera (Kasten-Young air mass), so lights near the horizon dim and
    redden."""
    z = np.degrees(np.arccos(np.clip(cos_i, 0.0, 1.0)))
    airmass = 1.0 / (np.clip(cos_i, 0.0, 1.0) + 0.50572 * (96.07995 - z) ** -1.6364)
    tau = np.array([0.09, 0.14, 0.26])
    return np.exp(-airmass[:, None] * tau[None, :])


def render(cam, tex, S, ss, rows=24):
    W, H = cam.W, cam.H
    surf = np.zeros((H, W, 3), np.float32)
    cover = np.zeros((H, W), np.float32)
    lights = np.zeros((H, W, 3), np.float32)
    atmo = np.zeros((H, W, 3), np.float32)
    xs = (np.arange(W * ss) + 0.5) / ss
    texel_km = tex.res * 111.195
    t0 = time.time()
    for r0 in range(0, H, rows):
        r1 = min(H, r0 + rows)
        ys = (np.arange(r0 * ss, r1 * ss) + 0.5) / ss
        X, Y = np.meshgrid(xs, ys)
        d = cam.rays(X.ravel(), Y.ravel())
        t = sphere_hit(cam.C, d)
        hit = np.isfinite(t)

        n = d.shape[0]
        base_c = np.zeros((n, 3), np.float32)
        light_c = np.zeros((n, 3), np.float32)
        if hit.any():
            P = cam.C + t[hit, None] * d[hit]
            nrm = P / RE
            cos_i = -(d[hit] * nrm).sum(-1)
            lat = np.degrees(np.arcsin(np.clip(nrm[:, 2], -1, 1)))
            lon = np.degrees(np.arctan2(nrm[:, 1], nrm[:, 0]))
            # Ground footprint of one subsample, across and along the view.
            across = t[hit] / (cam.f * ss)
            along = across / np.clip(cos_i, 0.03, 1.0)
            tex_km = texel_km * np.sqrt(np.cos(np.radians(lat)))
            mip = np.log2(np.maximum(np.sqrt(across * along) / tex_km, 1.0))
            b, li = tex.sample(lat, lon, mip)
            ext = extinction(cos_i)
            base_c[hit] = b * (0.35 + 0.65 * ext)
            light_c[hit] = li * ext
        a = atmosphere(cam.C, d, t, S)

        shape = (r1 - r0, ss, W, ss)
        def pool(v, ch=3):
            return v.reshape(shape + ((ch,) if ch else ())).mean(axis=(1, 3))
        surf[r0:r1] = pool(base_c * hit[:, None])
        cover[r0:r1] = pool(hit.astype(np.float32), ch=0)
        lights[r0:r1] = pool(light_c)
        atmo[r0:r1] = pool(a)
    print(f"  rendered {W}x{H} at {ss}x{ss} in {time.time() - t0:.1f}s")
    return surf, cover, lights, atmo


def blur(img, sigma):
    """Gaussian blur of a float image via three box passes per axis."""
    r = max(1, int(round(sigma * math.sqrt(3))))
    out = img.astype(np.float32)
    for axis in (0, 1):
        for _ in range(3):
            pad = [(0, 0)] * out.ndim
            pad[axis] = (r + 1, r)
            c = np.cumsum(np.pad(out, pad, mode="edge"), axis=axis, dtype=np.float64)
            hi = np.take(c, np.arange(2 * r + 1, c.shape[axis]), axis=axis)
            lo = np.take(c, np.arange(0, c.shape[axis] - 2 * r - 1), axis=axis)
            out = ((hi - lo) / (2 * r + 1)).astype(np.float32)
    return out


def additive_rgba(lin):
    """Encode additive light as straight-alpha RGBA: over a dark page the
    browser's normal blending then adds it, as light should."""
    s = linear_to_srgb(lin)
    a = np.clip(s.max(axis=-1), 0.0, 1.0)
    rgb = np.where(a[..., None] > 1e-4, s / np.maximum(a[..., None], 1e-4), 0.0)
    return np.dstack([np.clip(rgb, 0, 1), a])


def save_layers(name, frame, layers, out_dir):
    surf, cover, lights, atmo = layers
    # City glow: real night photos bloom around bright cities.
    lights = lights * 1.15 + blur(lights, 2.0) * 0.45 + blur(lights, 9.0) * 0.18
    rgb = np.where(cover[..., None] > 1e-4, surf / np.maximum(cover[..., None], 1e-4), 0.0)
    out = {
        "surface": np.dstack([np.clip(rgb, 0, 1), cover]),
        "lights": additive_rgba(lights),
        "atmosphere": additive_rgba(atmo),
    }
    out_dir.mkdir(parents=True, exist_ok=True)
    # Clear this frame's previous renders, so retired sizes don't linger.
    for old in list(out_dir.glob(f"earth-{name}-*.webp")) + list(out_dir.glob(f"earth-{name}-*.avif")):
        old.unlink()
    for layer, rgba in out.items():
        im = Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), "RGBA")
        for w in frame["widths"]:
            h = round(frame["height"] * w / frame["width"])
            sized = im if w == frame["width"] else im.resize((w, h), Image.LANCZOS)
            # AVIF for browsers that take it (about 60% smaller here), WebP
            # as the fallback. Both keep the fine points of light at these
            # settings.
            base = out_dir / f"earth-{name}-{layer}-{w}"
            sized.save(base.with_suffix(".avif"), "AVIF", quality=70, speed=4)
            sized.save(base.with_suffix(".webp"), "WEBP", quality=84 if layer == "lights" else 80,
                       method=6, alpha_quality=90)
            sizes = [f"{p.suffix[1:]} {p.stat().st_size // 1024} KB" for p in (base.with_suffix(".avif"), base.with_suffix(".webp"))]
            print(f"  {base.name}: {', '.join(sizes)}")
    return out


def composite(out, bg=(7, 8, 13)):
    """Flatten the layers over the page colour, for checking by eye."""
    H, W = out["surface"].shape[:2]
    img = np.ones((H, W, 3), np.float32) * (np.array(bg) / 255.0)
    for layer in ("surface", "lights", "atmosphere"):
        rgba = out[layer]
        a = rgba[..., 3:4]
        img = rgba[..., :3] * a + img * (1 - a)
    return img


# --- Scene export --------------------------------------------------------------

def visible_pass(cam, raan, inc=ORBIT_INC, alt=ORBIT_ALT, margin=0.05):
    """The stretch of an orbit that's on screen, in front of or above the
    Earth: start and end argument of latitude (radians), and its length on
    screen as a fraction of the frame width."""
    u = np.radians(np.arange(0, 360, 0.05))
    P = orbit_points(raan, u, inc, alt)
    x, y, z = cam.project(P)
    ok = (z > 0) & ~occluded(cam.C, P)
    mx, my = margin * cam.W, margin * cam.H
    inside = ok & (x > -mx) & (x < cam.W + mx) & (y > -my) & (y < cam.H + my)
    if not inside.any() or inside.all():
        return None
    # The orbit is a loop: start counting from a point that's off screen, so
    # a pass that crosses u = 0 isn't split in two.
    k = int(np.argmin(inside))
    inside, x, y = np.roll(inside, -k), np.roll(x, -k), np.roll(y, -k)
    idx = np.flatnonzero(inside)
    runs, start = [], idx[0]
    for a, b in zip(idx[:-1], idx[1:]):
        if b != a + 1:
            runs.append((start, a))
            start = b
    runs.append((start, idx[-1]))
    s, e = max(runs, key=lambda r: r[1] - r[0])
    length = float(np.hypot(np.diff(x[s:e + 1]), np.diff(y[s:e + 1])).sum() / cam.W)
    u0 = float(u[(s + k) % len(u)])
    u1 = float(u[(e + k) % len(u)])
    if u1 < u0:
        u1 += 2 * math.pi
    return u0, u1, length


# Real shells: Starlink (43°, 53°, 70°, 97.6°) and OneWeb (87.9°).
TRAFFIC_INCS = (43.0, 53.0, 70.0, 87.9, 97.6)


def pick_traffic(cam, hero, n=3, seed=7):
    """A few other satellites crossing the frame, for background traffic:
    long enough passes, spread apart from the hero pass and each other."""
    rng = np.random.default_rng(seed)
    hero_mid = pass_midpoint(cam, hero["raan"], ORBIT_INC, ORBIT_ALT, hero["pass"])
    picks, mids = [], [hero_mid]
    for _ in range(3000):
        alt = float(rng.uniform(480.0, 1150.0))
        inc = float(rng.choice(TRAFFIC_INCS))
        raan = float(rng.uniform(-180.0, 180.0))
        p = visible_pass(cam, raan, inc, alt, margin=0.0)
        if p is None or p[2] < 0.45:
            continue
        mid = pass_midpoint(cam, raan, inc, alt, p)
        if min(math.dist(mid, m) for m in mids) < 0.22:
            continue
        picks.append(dict(alt=alt, inc=inc, raan=raan, pass_=p))
        mids.append(mid)
        if len(picks) == n:
            break
    return picks


def pass_midpoint(cam, raan, inc, alt, p):
    u = np.array([(p[0] + p[1]) / 2])
    x, y, _ = cam.project(orbit_points(raan, u, inc, alt))
    return float(x[0] / cam.W), float(y[0] / cam.H)


def limb_apex(cam):
    """Highest point of the limb in the frame, as a fraction of height."""
    xs = np.linspace(0, cam.W, 64)
    best = cam.H
    for x in xs:
        lo, hi = 0.0, float(cam.H)
        for _ in range(40):
            mid = (lo + hi) / 2
            t = sphere_hit(cam.C, cam.rays(np.array([x]), np.array([mid])))
            if np.isfinite(t[0]):
                hi = mid
            else:
                lo = mid
        best = min(best, hi)
    return best / cam.H


def ts_vec(v):
    return "[" + ", ".join(f"{c:.6f}" for c in v) + "]"


def export_ts(path, scenes, S):
    lines = [
        "// Generated by scripts/render-earth.py. Don't edit by hand: change the",
        "// scene there and rerun it, so the image and this projection stay in sync.",
        "",
        "export type Vec3 = [number, number, number];",
        "",
        "export type EarthFrame = {",
        "  /** Rendered image size in px; positions below are in this space. */",
        "  width: number;",
        "  height: number;",
        "  /** Widths the layers are published at, as public/earth/earth-<name>-<layer>-<w>.{avif,webp}. */",
        "  widths: number[];",
        "  name: string;",
        "  /** Camera altitude above the surface, km. */",
        "  altitude: number;",
        "  camera: { position: Vec3; forward: Vec3; right: Vec3; up: Vec3; focal: number; cx: number; cy: number };",
        "  /** The hero satellite's orbit and its on-screen pass. */",
        "  orbit: Orbit;",
        "  /** Other satellites crossing the frame, drawn faint with no orbit line. */",
        "  traffic: Orbit[];",
        "  /** Waterloo, Ontario, projected into the frame (fractions). */",
        "  waterloo: { x: number; y: number } | null;",
        "};",
        "",
        "/** Circular orbit: position(u) = radius * (cos u * node + sin u * ahead),",
        " *  u in radians. start/end bound the stretch that's visible in the frame. */",
        "export type Orbit = { radius: number; node: Vec3; ahead: Vec3; start: number; end: number };",
        "",
        "export const EARTH_RADIUS = 6371;",
        "/** Earth's gravitational parameter, km³/s², for orbital speeds. */",
        "export const MU = 398600.4418;",
        f"/** Unit vector toward the Sun (subsolar point {SUN_LAT}°N, {SUN_LON}°E). */",
        f"export const SUN: Vec3 = {ts_vec(S)};",
        "",
    ]

    def orbit_ts(raan, inc, alt, p, indent):
        node, ahead = orbit_basis(raan, inc)
        pad = " " * indent
        return [
            f"{pad}radius: {RE + alt:.1f},",
            f"{pad}node: {ts_vec(node)},",
            f"{pad}ahead: {ts_vec(ahead)},",
            f"{pad}start: {p[0]:.6f},",
            f"{pad}end: {p[1]:.6f},",
        ]

    for name, sc in scenes.items():
        cam, frame = sc["cam"], sc["frame"]
        wl = sc["waterloo"]
        traffic = []
        for t in sc["traffic"]:
            traffic += [
                f"    // {t['inc']:.1f}° inclination, {t['alt']:.0f} km",
                "    {",
                *orbit_ts(t["raan"], t["inc"], t["alt"], t["pass_"], 6),
                "    },",
            ]
        lines += [
            f"export const EARTH_{name.upper()}: EarthFrame = {{",
            f'  name: "{name}",',
            f"  width: {cam.W},",
            f"  height: {cam.H},",
            f"  widths: [{', '.join(str(w) for w in frame['widths'])}],",
            f"  altitude: {frame['alt']:.0f},",
            "  camera: {",
            f"    position: {ts_vec(cam.C)},",
            f"    forward: {ts_vec(cam.fwd)},",
            f"    right: {ts_vec(cam.right)},",
            f"    up: {ts_vec(cam.up)},",
            f"    focal: {cam.f:.4f},",
            f"    cx: {cam.cx:.4f},",
            f"    cy: {cam.cy:.4f},",
            "  },",
            f"  // {ORBIT_INC:.0f}° inclination, {ORBIT_ALT:.0f} km",
            "  orbit: {",
            *orbit_ts(frame["raan"], ORBIT_INC, ORBIT_ALT, sc["pass"], 4),
            "  },",
            "  traffic: [",
            *traffic,
            "  ],",
            ("  waterloo: null," if wl is None else f"  waterloo: {{ x: {wl[0]:.5f}, y: {wl[1]:.5f} }},"),
            "};",
            "",
        ]
    Path(path).write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {path}")


def draw_orbit_preview(img, cam, raan, S, pas):
    """Mark the orbit pass and Waterloo on a preview image."""
    H, W = img.shape[:2]
    u = np.linspace(pas[0], pas[1], 2000)
    P = orbit_points(raan, u)
    x, y, _ = cam.project(P)
    lit = sunlit(P, S)
    for xi, yi, li in zip(x, y, lit):
        xi, yi = int(xi * W / cam.W), int(yi * H / cam.H)
        if 0 <= xi < W and 0 <= yi < H:
            img[max(0, yi - 1):yi + 1, max(0, xi - 1):xi + 1] = (0.79, 0.66, 0.42) if li > 0.5 else (0.5, 0.25, 0.3)
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("ts", type=Path)
    ap.add_argument("--preview", type=Path, help="write quick low-res renders here instead")
    ap.add_argument("--check", type=Path, help="also write flattened full-size composites here")
    ap.add_argument("--only", choices=list(FRAMES))
    args = ap.parse_args()
    if args.only and not args.preview:
        # lib/earth-scene.ts must always hold every frame, or the page breaks.
        ap.error("--only is for --preview runs; a full render writes every frame")

    S = unit(ecef(SUN_LAT, SUN_LON))
    preview = args.preview is not None
    frames = {k: v for k, v in FRAMES.items() if not args.only or k == args.only}

    scenes = {}
    for name, frame in frames.items():
        f = dict(frame)
        if preview:
            scale = 0.35
            f["width"], f["height"] = round(f["width"] * scale), round(f["height"] * scale)
        cam = Camera(**f)
        scenes[name] = {"cam": cam, "frame": f}

    # Find the lat/lon window every frame sees, then load that much texture.
    lat_lo, lat_hi, lon_lo, lon_hi = 90.0, -90.0, 180.0, -180.0
    for sc in scenes.values():
        cam = sc["cam"]
        gx, gy = np.meshgrid(np.linspace(0, cam.W, 160), np.linspace(0, cam.H, 120))
        d = cam.rays(gx.ravel(), gy.ravel())
        t = sphere_hit(cam.C, d)
        P = cam.C + t[np.isfinite(t), None] * d[np.isfinite(t)]
        lat = np.degrees(np.arcsin(P[:, 2] / RE))
        lon = np.degrees(np.arctan2(P[:, 1], P[:, 0]))
        lat_lo, lat_hi = min(lat_lo, lat.min()), max(lat_hi, lat.max())
        lon_lo, lon_hi = min(lon_lo, lon.min()), max(lon_hi, lon.max())
    res = 1.0 / 30 if preview else 1.0 / 120
    pad = 1.5
    bounds = (math.floor((lat_lo - pad) * 2) / 2, math.ceil((lat_hi + pad) * 2) / 2,
              math.floor((lon_lo - pad) * 2) / 2, math.ceil((lon_hi + pad) * 2) / 2)
    print(f"texture window lat {bounds[0]}..{bounds[1]}, lon {bounds[2]}..{bounds[3]}")
    tex = Texture(args.src, bounds, res, preview)

    for name, sc in scenes.items():
        cam, f = sc["cam"], sc["frame"]
        print(name)
        layers = render(cam, tex, S, ss=1 if preview else 3)
        sc["pass"] = visible_pass(cam, f["raan"])
        sc["raan"] = f["raan"]
        sc["traffic"] = pick_traffic(cam, sc)
        sc["limb"] = limb_apex(cam)
        wP = ecef(*WATERLOO, RE)[None, :]
        wx, wy, wz = cam.project(wP)
        facing = ((wP - cam.C) @ (wP[0] / RE)) < 0
        sc["waterloo"] = (float(wx[0] / cam.W), float(wy[0] / cam.H)) if (wz[0] > 0 and facing[0]) else None
        print(f"  pass {sc['pass']}, limb top {sc['limb']:.3f}, waterloo {sc['waterloo']}")
        for t in sc["traffic"]:
            print(f"  traffic {t['inc']:.1f}° {t['alt']:.0f} km raan {t['raan']:.1f}: {t['pass_']}")
        if preview:
            surf, cover, lights, atmo = layers
            lights = lights * 1.15 + blur(lights, 1.0) * 0.45 + blur(lights, 3.5) * 0.18
            rgb = np.where(cover[..., None] > 1e-4, surf / np.maximum(cover[..., None], 1e-4), 0.0)
            out = {"surface": np.dstack([rgb, cover]), "lights": additive_rgba(lights),
                   "atmosphere": additive_rgba(atmo)}
            img = composite(out)
            if sc["pass"]:
                img = draw_orbit_preview(img, cam, f["raan"], S, sc["pass"])
            for t in sc["traffic"]:
                u = np.linspace(t["pass_"][0], t["pass_"][1], 800)
                x, y, _ = cam.project(orbit_points(t["raan"], u, t["inc"], t["alt"]))
                for xi, yi in zip(x.astype(int), y.astype(int)):
                    if 0 <= xi < img.shape[1] and 0 <= yi < img.shape[0]:
                        img[yi, xi] = (0.45, 0.6, 0.8)
            args.preview.mkdir(parents=True, exist_ok=True)
            Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(args.preview / f"preview-{name}.png")
        else:
            out = save_layers(name, f, layers, args.out)
            if args.check:
                img = composite(out)
                img = draw_orbit_preview(img, cam, f["raan"], S, sc["pass"])
                args.check.mkdir(parents=True, exist_ok=True)
                Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(args.check / f"check-{name}.png")

    if not preview:
        export_ts(args.ts, scenes, S)


if __name__ == "__main__":
    main()
