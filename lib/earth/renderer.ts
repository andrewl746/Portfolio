// The live Earth. A WebGL2 fragment shader traces one ray per pixel from a
// camera above the Earth, the same way scripts/render-earth.py renders the
// Contact finale image: the ray hits an Earth-sized sphere and is coloured
// from NASA's Black Marble city lights at that latitude and longitude, the
// lights dim and redden toward the limb (Kasten-Young air mass), and the
// twilight band, the faint blue limb and the green airglow layer use the
// script's own formulas. So from the finale's camera it draws the finale, and
// the page can end on that image (docs/earth.md).
//
// Lights come from a high-resolution map of eastern North America, where the
// camera spends its time, and from the global map elsewhere. The maps are
// made by scripts/make-earth-maps.py.
import type { Vec3 } from "./math";
import type { Camera } from "./view";

const MAPS = "/earth/";

const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec3 uC, uFwd, uRight, uUp, uSun;
uniform float uF;
uniform vec2 uCenter;
uniform vec4 uRegion;            // west edge, north edge, width, height, in degrees
uniform sampler2D uNightG, uNightR, uBase, uDay;
uniform float uHasRegion, uHasGlobal, uFade;
out vec4 o;
const float PI = 3.141592653589793, RE = 6371.0, GAIN = 2.2;
const vec3 BLUE = vec3(0.1144, 0.3763, 1.0);
const vec3 WARM = vec3(1.0, 0.3050, 0.1144);
const vec3 AIRGLOW = vec3(0.3050, 1.0, 0.4020);
vec3 lin(vec3 c){ return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 srgb(vec3 c){ c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
float max3(vec3 c){ return max(c.r, max(c.g, c.b)); }
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec3 d = normalize(uFwd + ((px.x - uCenter.x) / uF) * uRight - ((px.y - uCenter.y) / uF) * uUp);
  float b = dot(d, uC);
  float tc = -b;                          // along the ray to its closest point to the Earth's centre
  vec3 Pc = uC + tc * d;
  float rc = length(Pc);
  float ht = rc - RE;                     // that point's altitude: how much air the ray crosses

  // Air: lit from below where the Sun is under the horizon but the air is above Earth's shadow.
  vec3 glow = vec3(0.0);
  if (tc > 0.0) {
    float cosz = dot(Pc / rc, uSun);
    float beta = asin(clamp(-cosz, -1.0, 1.0));
    float shadow = cosz < 0.0 ? RE * (1.0 / cos(clamp(beta, 0.0, 1.4)) - 1.0) : 0.0;
    float above = ht - shadow;
    float lit = smoothstep(-3.0, 8.0, above);
    float h = max(ht, 0.0);
    float band = lit * (exp(-h / 11.0) * 3.2 + exp(-h / 32.0) * 0.45);
    float tint = smoothstep(3.0, 24.0, above);
    glow = band * (WARM * (1.0 - tint) * 0.6 + BLUE * tint)
         + (exp(-abs(ht) / 7.0) * 0.10 + exp(-abs(ht) / 40.0) * 0.035) * BLUE
         + exp(-pow((ht - 95.0) / 5.5, 2.0)) * 0.018 * AIRGLOW;
    if (ht < 0.0) glow *= exp(ht / 45.0);
  }
  vec3 As = srgb(glow);
  float aA = clamp(max3(As), 0.0, 1.0);

  float kmPerPx = max(tc, 1.0) / uF;
  float cover = tc > 0.0 ? clamp(0.5 - ht / kmPerPx, 0.0, 1.0) : 0.0;
  vec3 col = As;
  float alpha = aA;
  if (cover > 0.0) {
    float disc = b * b - (dot(uC, uC) - RE * RE);
    vec3 n = normalize(uC + (-b - sqrt(max(disc, 0.0))) * d);
    float cosI = clamp(-dot(d, n), 0.0, 1.0);
    float zen = degrees(acos(cosI));
    float airmass = 1.0 / (cosI + 0.50572 * pow(max(96.07995 - zen, 0.001), -1.6364));
    vec3 ext = exp(-airmass * vec3(0.09, 0.14, 0.26));
    float lat = asin(clamp(n.z, -1.0, 1.0)), lon = atan(n.y, n.x);
    float u1 = lon / (2.0 * PI) + 0.5;
    float ua = fract(u1), ub = fract(u1 + 0.5) - 0.5;
    vec2 uvG = vec2(fwidth(ua) < fwidth(ub) ? ua : ub, 0.5 - lat / PI);
    vec2 uvR = vec2((degrees(lon) - uRegion.x) / uRegion.z, (uRegion.y - degrees(lat)) / uRegion.w);
    vec2 edge = smoothstep(vec2(0.0), vec2(0.025), uvR) * smoothstep(vec2(0.0), vec2(0.025), 1.0 - uvR);
    float inR = edge.x * edge.y * uHasRegion;

    // City lights, with the glow real night photos show around bright cities.
    vec3 L0 = mix(texture(uNightG, uvG).rgb, texture(uNightR, uvR).rgb, inR);
    vec3 L1 = mix(texture(uNightG, uvG, 1.5).rgb, texture(uNightR, uvR, 1.5).rgb, inR);
    vec3 L2 = mix(texture(uNightG, uvG, 3.5).rgb, texture(uNightR, uvR, 3.5).rgb, inR);
    float mu = dot(n, uSun);
    vec3 lights = (L0 * 1.3 + L1 * 0.5 + L2 * 0.3) * vec3(1.08, 1.02, 0.94) / GAIN * ext * uHasGlobal * (1.0 - smoothstep(-0.12, 0.02, mu));

    vec3 s = texture(uBase, uvG).rgb * (0.35 + 0.65 * ext);
    // Daylight past the terminator, where the camera can see that far.
    vec4 dayTex = texture(uDay, uvG);
    if (mu > -0.02) {
      vec3 ground = mix(vec3(0.010, 0.040, 0.105), dayTex.rgb * 0.9 + 0.012, dayTex.a);
      vec3 sunCol = mix(vec3(1.0, 0.56, 0.32), vec3(1.0, 0.96, 0.90), smoothstep(0.0, 0.30, mu));
      s = srgb(lin(s) + ground * sunCol * max(mu, 0.0) * 2.0 * ext + BLUE * 0.25 * smoothstep(-0.02, 0.2, mu) * (1.0 - cosI));
    }
    vec3 Ls = srgb(lights);
    s = Ls + s * (1.0 - clamp(max3(Ls), 0.0, 1.0));
    s = As + s * (1.0 - aA);
    col = mix(As, s, cover);
    alpha = mix(aA, 1.0, cover);
  }
  o = vec4(col, alpha) * uFade;
}`;

const UNIFORMS = [
  "uRes", "uC", "uFwd", "uRight", "uUp", "uSun", "uF", "uCenter", "uRegion",
  "uNightG", "uNightR", "uBase", "uDay", "uHasRegion", "uHasGlobal", "uFade",
] as const;
type UniformName = (typeof UNIFORMS)[number];
type MapName = "uBase" | "uNightG" | "uNightR" | "uDay";

export type EarthRenderer = {
  /** False when the browser has no WebGL2: the page falls back to the finale image. */
  ok: boolean;
  /** Match the drawing buffer to the canvas's CSS size at `scale` device px per CSS px. */
  resize(scale: number): void;
  /** sun: unit vector to the Sun. fade: 0 to 1. */
  render(cam: Camera, sun: Vec3, fade?: number): void;
  /** Called when a map has arrived (or the context came back), so a redraw is due. */
  onchange: (() => void) | null;
  dispose(): void;
};

const NONE: EarthRenderer = { ok: false, resize() {}, render() {}, onchange: null, dispose() {} };

export function createEarthRenderer(canvas: HTMLCanvasElement): EarthRenderer {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return NONE;

  let U = {} as Record<UniformName, WebGLUniformLocation | null>;
  let has: Record<MapName, number> = { uBase: 0, uNightG: 0, uNightR: 0, uDay: 0 };
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let textures: WebGLTexture[] = [];
  let alive = false; // the context is there and set up
  let disposed = false;
  let generation = 0; // goes up when the context is rebuilt, so late map loads from before it are dropped

  const self: EarthRenderer = { ok: true, resize, render, onchange: null, dispose };

  function compile(type: number, src: string) {
    const s = gl!.createShader(type);
    if (!s) return null;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
      console.error(gl!.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  function loadMap(unit: number, name: MapName, file: string, repeat: boolean, light: boolean) {
    const g = gl!;
    const mine = generation;
    const tex = g.createTexture();
    if (!tex) return;
    textures.push(tex);
    g.activeTexture(g.TEXTURE0 + unit);
    g.bindTexture(g.TEXTURE_2D, tex);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, 1, 1, 0, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    g.uniform1i(U[name], unit);
    const img = new Image();
    const upload = () => {
      if (disposed || mine !== generation || !alive) return;
      g.activeTexture(g.TEXTURE0 + unit);
      g.bindTexture(g.TEXTURE_2D, tex);
      g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      g.texImage2D(g.TEXTURE_2D, 0, light ? g.SRGB8_ALPHA8 : g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img);
      g.generateMipmap(g.TEXTURE_2D);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR_MIPMAP_LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, repeat ? g.REPEAT : g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
      const aniso = g.getExtension("EXT_texture_filter_anisotropic");
      if (aniso) {
        const most = g.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
        g.texParameterf(g.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, most));
      }
      has[name] = 1;
      self.onchange?.();
    };
    // Decoded off the main thread where the browser can, so a 13 megapixel map
    // arriving doesn't stall a frame of the opening animation. If the browser
    // hasn't said it's decoded shortly after it has loaded (some hold decode()
    // back in a background tab), it goes up anyway.
    let sent = false;
    const send = () => {
      if (sent) return;
      sent = true;
      upload();
    };
    img.decoding = "async";
    img.addEventListener("load", () => window.setTimeout(send, 400), { once: true });
    img.src = MAPS + file;
    img.decode().then(send, () => {});
  }

  function setup() {
    const g = gl!;
    const vs = compile(g.VERTEX_SHADER, VERT);
    const fs = compile(g.FRAGMENT_SHADER, FRAG);
    program = g.createProgram();
    if (!vs || !fs || !program) return false;
    g.attachShader(program, vs);
    g.attachShader(program, fs);
    g.linkProgram(program);
    g.deleteShader(vs);
    g.deleteShader(fs);
    if (!g.getProgramParameter(program, g.LINK_STATUS)) {
      console.error(g.getProgramInfoLog(program));
      return false;
    }
    g.useProgram(program);
    buffer = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, buffer);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const loc = g.getAttribLocation(program, "p");
    g.enableVertexAttribArray(loc);
    g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
    U = {} as typeof U;
    for (const n of UNIFORMS) U[n] = g.getUniformLocation(program, n);
    g.uniform4f(U.uRegion, -112, 62, 60, 54);
    g.disable(g.BLEND);
    g.viewport(0, 0, canvas.width, canvas.height);

    generation++;
    alive = true;
    has = { uBase: 0, uNightG: 0, uNightR: 0, uDay: 0 };
    textures = [];
    // Bigger maps only where the screen can show them. A phone or a tablet
    // gets the small ones whatever its pixel density: a quarter of the
    // graphics memory (which is what makes a mobile browser drop a page) and
    // about half a megabyte less to load.
    const handheld =
      Math.min(window.innerWidth, window.innerHeight) < 500 || window.matchMedia("(pointer: coarse)").matches;
    const big = !handheld && Math.max(window.innerWidth, window.innerHeight) * Math.min(2, window.devicePixelRatio || 1) > 1500;
    loadMap(0, "uBase", "map-base-2048.webp", true, false);
    loadMap(1, "uNightG", big ? "map-night-4096.webp" : "map-night-2048.webp", true, true);
    loadMap(2, "uNightR", big ? "map-region-3840.webp" : "map-region-1920.webp", false, true);
    loadMap(3, "uDay", "map-day-2048.webp", true, true);
    return true;
  }

  // A phone can take the graphics context away while the page is in the
  // background. Saying we'll handle it lets the browser hand one back.
  const onLost = (e: Event) => {
    e.preventDefault();
    alive = false;
  };
  const onRestored = () => {
    if (disposed) return;
    if (setup()) self.onchange?.();
  };

  function resize(scale: number) {
    const w = Math.max(1, Math.round(canvas.clientWidth * scale));
    const h = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    if (alive) gl!.viewport(0, 0, w, h);
  }

  function render(cam: Camera, sun: Vec3, fade = 1) {
    if (!alive) return;
    const g = gl!;
    // Device px per CSS px, from the buffer itself, so the picture is right
    // whatever rounding sized it.
    const k = canvas.width / Math.max(1, canvas.clientWidth);
    g.uniform2f(U.uRes, canvas.width, canvas.height);
    g.uniform3fv(U.uC, cam.C);
    g.uniform3fv(U.uFwd, cam.fwd);
    g.uniform3fv(U.uRight, cam.right);
    g.uniform3fv(U.uUp, cam.up);
    g.uniform3fv(U.uSun, sun);
    g.uniform1f(U.uF, cam.f * k);
    g.uniform2f(U.uCenter, cam.cx * k, cam.cy * k);
    g.uniform1f(U.uHasRegion, has.uNightR);
    g.uniform1f(U.uHasGlobal, has.uNightG);
    g.uniform1f(U.uFade, fade);
    g.clearColor(0, 0, 0, 0);
    g.clear(g.COLOR_BUFFER_BIT);
    if (fade > 0.003) g.drawArrays(g.TRIANGLES, 0, 3);
  }

  function dispose() {
    disposed = true;
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    if (alive) {
      for (const t of textures) gl!.deleteTexture(t);
      gl!.deleteBuffer(buffer);
      gl!.deleteProgram(program);
    }
    alive = false;
  }

  if (gl.isContextLost() || !setup()) {
    alive = false;
    return NONE;
  }
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  return self;
}
