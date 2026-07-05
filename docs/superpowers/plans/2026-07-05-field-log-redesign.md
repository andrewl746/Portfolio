# Field Log Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild andrewli.app's one-page presentation as the "Field Log" observatory theme: logbook sidebar, coordinate grid, per-section constellations, denser twinkling starfield, instrument-style hovers, tech stack with brand-colored icons.

**Architecture:** Same static Next.js app on branch `portfolio-site`. Content stays centralized in `lib/`; three client components (Starfield, Sidebar scroll-spy, CursorGlow); everything else server components. Old Nav/Hero/Competition/Reveal/Sagittarius components are deleted and replaced.

**Tech Stack:** Next.js 16.2.10 (App Router), React 19, Tailwind 4, Fraunces + JetBrains Mono via next/font/google, simple-icons (scratchpad-only extraction, NOT a project dependency).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-05-field-log-redesign.md`. Its color tokens, copy amendments, and "what to avoid" list are binding.
- Copy: no em dashes ("ENTRY 0X / CURRENT", never with an em dash), no LinkedIn, no "incoming", no "class of 2031", no "max rating", no "Missions"/"Trajectory"/"Logged Sightings". Section names: About, Projects, Experience, Tech, Contact.
- Zero border radius on UI elements. Round things: stars, constellation nodes, radial glows only.
- Ember (#e0455f) only on: CURRENT nav entry, current sighting (OlympIQ), stat-block borders, CTA, hover accents, the two glows.
- Respect `prefers-reduced-motion`: disable grid draw-in, twinkle animation, cursor glow.
- No new npm dependencies in the project (`simple-icons` is installed only in the scratchpad to extract path data).
- Verification per task: `npx tsc --noEmit` or `npm run build` as stated; full visual pass in the final task.
- Resume files (`resume/`, `public/resume.pdf`) are untouched.

---

### Task 1: Theme foundation (tokens, fonts, metadata)

**Files:**
- Modify: `app/globals.css` (full replace)
- Modify: `app/layout.tsx` (full replace)

**Interfaces:**
- Produces: Tailwind colors `void`, `line` (#161a29), `parchment`, `ember`, `brass`, `primary`, `body`, `dim` (#6a7088), `faint` (#3d4258); fonts `font-serif` (Fraunces) and `font-mono` (JetBrains Mono, also the body default); CSS classes `.coord-grid`, `.constellation-star`, `.margin-rule`. All later tasks use these exact names.

- [ ] **Step 1: Replace `app/globals.css`**

```css
@import "tailwindcss";

:root {
  --void: #07080d;
  --surface-line: #161a29;
  --parchment: #e8e2d3;
  --ink: #1a1d2b;
  --ember: #e0455f;
  --ember-dim: rgba(224, 69, 95, 0.35);
  --brass: #a8895a;
  --text-primary: #eceef4;
  --text-body: #828aa3;
  --text-muted: #6a7088;
  --text-faint: #3d4258;
}

@theme inline {
  --color-void: var(--void);
  --color-line: var(--surface-line);
  --color-parchment: var(--parchment);
  --color-ember: var(--ember);
  --color-brass: var(--brass);
  --color-primary: var(--text-primary);
  --color-body: var(--text-body);
  --color-dim: var(--text-muted);
  --color-faint: var(--text-faint);
  --font-serif: var(--font-fraunces);
  --font-mono: var(--font-jbmono);
  --radius: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--void);
  color: var(--text-body);
  font-family: var(--font-jbmono), ui-monospace, monospace;
}

::selection {
  background: rgba(224, 69, 95, 0.35);
  color: var(--text-primary);
}

/* Coordinate grid over the main content area, draws in on load. */
.coord-grid {
  background-image:
    linear-gradient(var(--surface-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--surface-line) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.35;
  animation: grid-in 1.4s ease-out;
}

@keyframes grid-in {
  from { opacity: 0; }
  to { opacity: 0.35; }
}

/* Star twinkle used by constellation nodes. */
@keyframes twinkle {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.9; }
}

.constellation-star {
  animation: twinkle 5s ease-in-out infinite;
}

/* Logbook margin rule on the sidebar's right edge. */
.margin-rule {
  border-right: 1px solid #221f26;
  box-shadow: 1px 0 0 rgba(224, 69, 95, 0.15);
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .coord-grid { animation: none; }
  .constellation-star { animation: none; }
}
```

- [ ] **Step 2: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://andrewli.app"),
  title: "Andrew Li",
  description:
    "Computer Science student at the University of Waterloo. Builder of OlympIQ and other tools that make people's lives a little easier.",
  openGraph: {
    title: "Andrew Li",
    description:
      "Computer Science student at the University of Waterloo. Builder of OlympIQ and other tools that make people's lives a little easier.",
    url: "https://andrewli.app",
    siteName: "Andrew Li",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify typecheck** (site still references old classes; full build defers to Task 5)

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "Switch theme foundation to Field Log tokens and fonts"
```

---

### Task 2: Data modules (content amendments, constellations, tech stack)

**Files:**
- Modify: `lib/content.ts` (full replace)
- Create: `lib/constellations.ts`
- Create: `lib/techstack.ts` (generated via scratchpad script from simple-icons)

**Interfaces:**
- Produces:
  - `lib/content.ts`: `SITE = { name, identity, tagline, sub, email, github, resumeHref }`; `STATS: { eyebrow: string; value: string }[]`; `type Project` gains required `coord: string`; `FLAGSHIP: Project`; `PROJECTS: Project[]`; `RESULTS: { event: string; result: string; year: string }[]`; `EXPERIENCE` unchanged shape.
  - `lib/constellations.ts`: `type ConstellationName = "sagittarius" | "ursaMajor" | "cygnus" | "orion" | "gemini"`; `CONSTELLATIONS: Record<ConstellationName, { stars: [number, number, number][]; edges: [number, number][] }>`.
  - `lib/techstack.ts`: `TECH_STACK: { name: string; hex: string; path: string }[]` (path = 24x24 viewBox SVG path data).

- [ ] **Step 1: Replace `lib/content.ts`**

```ts
export type Project = {
  name: string;
  context: string;
  description: string;
  tech: string[];
  coord: string;
  github?: string;
  live?: string;
  award?: string;
};

export const SITE = {
  name: "Andrew Li",
  identity: "Computer Science student at the University of Waterloo.",
  tagline: "I enjoy building software that makes people's lives a little easier.",
  sub: "Currently building OlympIQ, the platform my high school's Science Olympics program runs on.",
  email: "andrewli746@gmail.com",
  github: "https://github.com/andrewl746",
  resumeHref: "/resume.pdf",
};

export const STATS = [
  { eyebrow: "Problems solved", value: "500+" },
  { eyebrow: "Founder", value: "OlympIQ" },
  { eyebrow: "Hackathons", value: "4" },
];

export const FLAGSHIP: Project = {
  name: "OlympIQ",
  context: "Live at olympiq.ca",
  description:
    "Science Olympics, minus the spreadsheets. OlympIQ runs my high school's Science Olympics program end to end: event schedules with automatic conflict detection and Excel export, preference-based competitor-to-event assignment, shared materials, and attendance tracking. Teachers, executives, and competitors each get their own role, joined by team code.",
  tech: ["Next.js", "TypeScript", "Firebase", "Firestore"],
  coord: "RA 19h 04m / DEC -25 18",
  github: "https://github.com/andrewl746/OlympIQ",
  live: "https://www.olympiq.ca",
};

export const PROJECTS: Project[] = [
  {
    name: "Flowboard",
    context: "JamHacks 2026",
    description:
      "Turns a GitHub repository into an interactive flowchart. Folders, files, and functions become nodes on a canvas, and an assistant grounded in the actual file tree and code excerpts answers questions about where to start reading.",
    tech: ["Next.js", "React Flow", "Zustand", "Anthropic API"],
    coord: "RA 05h 32m / DEC +22 01",
    github: "https://github.com/andrewl746/Flowboard",
  },
  {
    name: "TeacherAId",
    context: "GenAI Genesis 2026",
    description:
      "Reads student reasoning, not just their answers. Classifies misconceptions from written explanations, builds per-student profiles and class-wide analytics, and tells teachers what to reteach next.",
    tech: ["Firebase", "Claude API", "Cloudflare Workers"],
    coord: "RA 12h 51m / DEC +56 22",
    github: "https://github.com/andrewl746/TeacherAId",
  },
  {
    name: "FrostByte",
    context: "Hack Canada 2025",
    description:
      "Estimates frostbite and hypothermia risk from live weather and what you're wearing, then tells you how long you can safely stay outside.",
    tech: ["Next.js", "Node.js", "Firebase", "Gemini API"],
    coord: "RA 20h 41m / DEC +45 17",
    github: "https://github.com/andrewl746/FrostByte",
    award: "Best Use of Gemini AI",
  },
  {
    name: "CourtManager",
    context: "IB HL CS Internal Assessment",
    description:
      "Team management for my high school's tennis doubles squad, with a custom merge-sort based pairing algorithm, player records, and lineup planning.",
    tech: ["Java", "Spring Boot", "JavaScript"],
    coord: "RA 07h 34m / DEC +31 53",
    github: "https://github.com/andrewl746/CourtManager",
  },
];

export const RESULTS = [
  { event: "CCC Senior", result: "Distinction", year: "2024, 2025, 2026" },
  { event: "USACO", result: "Silver Division", year: "2024" },
  { event: "CALICO", result: "Bronze", year: "2024" },
  { event: "DMOJ", result: "Top 2%, 300+ points", year: "ongoing" },
  { event: "Codeforces", result: "Rating 1200+", year: "ongoing" },
  { event: "St. Lawrence Coding Competition", result: "1st place team", year: "2024" },
];

export const EXPERIENCE = [
  {
    org: "Kurius",
    role: "C++ Instructor, Outreach and Partnership Coordinator",
    period: "Dec 2023 to present",
    bullets: [
      "Taught a 5-week Introduction to C++ course to university students. By the end, students who had never written C++ were shipping functional programs.",
      "Coordinate sponsor and partnership outreach for the nonprofit's free technology education programs.",
    ],
  },
  {
    org: "Science Olympics Club, Victoria Park CI",
    role: "Head Trainer",
    period: "Sep 2023 to Jun 2026",
    bullets: [
      "Led a team of 6 trainers. All 4 junior teams I coached placed 1st at Western University's Science Olympics.",
      "Designed the club's first structured training program, recruiting experienced competitors as trainers.",
      "Then built OlympIQ so the next generation of trainers never has to touch a spreadsheet.",
    ],
  },
];
```

- [ ] **Step 2: Create `lib/constellations.ts`** (stylized asterisms; `stars` entries are `[x, y, radius]` in a 300x260 viewBox)

```ts
export type ConstellationName =
  | "sagittarius"
  | "ursaMajor"
  | "cygnus"
  | "orion"
  | "gemini";

type ConstellationData = {
  stars: [number, number, number][];
  edges: [number, number][];
};

export const CONSTELLATIONS: Record<ConstellationName, ConstellationData> = {
  // The Teapot asterism.
  sagittarius: {
    stars: [
      [40, 150, 3],
      [95, 130, 3.5],
      [85, 195, 4],
      [135, 75, 3.5],
      [185, 110, 3],
      [230, 85, 4],
      [250, 130, 3],
      [215, 170, 3.5],
    ],
    edges: [
      [0, 1], [0, 2], [1, 2], [1, 3], [3, 4], [4, 1],
      [4, 7], [7, 2], [4, 5], [5, 6], [6, 7],
    ],
  },
  // The Big Dipper.
  ursaMajor: {
    stars: [
      [250, 55, 3],
      [210, 80, 3],
      [175, 100, 3],
      [145, 120, 3],
      [75, 110, 3.5],
      [85, 175, 3],
      [150, 180, 3],
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
  },
  // The Northern Cross.
  cygnus: {
    stars: [
      [150, 40, 3.5],
      [150, 110, 3],
      [150, 215, 3],
      [70, 155, 3],
      [235, 70, 3],
    ],
    edges: [[0, 1], [1, 2], [1, 3], [1, 4]],
  },
  // Shoulders, belt, feet.
  orion: {
    stars: [
      [100, 60, 3.5],
      [200, 65, 3],
      [135, 130, 2.5],
      [153, 138, 2.5],
      [171, 146, 2.5],
      [110, 220, 3],
      [205, 215, 3.5],
    ],
    edges: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]],
  },
  // The twins.
  gemini: {
    stars: [
      [110, 45, 3.5],
      [190, 55, 3.5],
      [105, 120, 3],
      [195, 130, 3],
      [95, 205, 3],
      [205, 210, 3],
    ],
    edges: [[0, 2], [2, 4], [1, 3], [3, 5], [2, 3]],
  },
};
```

- [ ] **Step 3: Generate `lib/techstack.ts` from simple-icons in the scratchpad** (accurate brand SVG paths; do NOT hand-write path data). Create `<scratchpad>/tech-icons/extract.js`, run `npm install simple-icons` there first:

```js
const fs = require("fs");
const icons = require("simple-icons");

// [display name, simple-icons export]
const WANTED = [
  ["C++", "siCplusplus"],
  ["Java", "siOpenjdk"],
  ["Python", "siPython"],
  ["TypeScript", "siTypescript"],
  ["JavaScript", "siJavascript"],
  ["React", "siReact"],
  ["Next.js", "siNextdotjs"],
  ["Node.js", "siNodedotjs"],
  ["Tailwind CSS", "siTailwindcss"],
  ["Firebase", "siFirebase"],
  ["Cloudflare", "siCloudflare"],
  ["Spring Boot", "siSpringboot"],
  ["Git", "siGit"],
];

const entries = WANTED.map(([name, key]) => {
  const icon = icons[key];
  if (!icon) {
    console.error("MISSING:", key);
    process.exit(1);
  }
  return { name, hex: "#" + icon.hex, path: icon.path };
});

const out = `// Generated from simple-icons (CC0 path data). Regenerate with the
// extract script if the stack changes.
export const TECH_STACK: { name: string; hex: string; path: string }[] = ${JSON.stringify(entries, null, 2)};
`;
fs.writeFileSync(process.argv[2], out);
console.log("Wrote", process.argv[2], entries.length, "icons");
```

Run: `node extract.js "<repo>/lib/techstack.ts"`
Expected: `Wrote ... 13 icons`. If any export name errors (simple-icons renames occasionally), list available keys with `node -e "console.log(Object.keys(require('simple-icons')).filter(k => /java|spring|next/i.test(k)))"` and fix the mapping. Some hexes are light (JavaScript #F7DF1E) and some dark; they render on `--void` so all are visible.

- [ ] **Step 4: Verify typecheck** (old section components still import `COMPETITION` which no longer exists, so expect THAT error only; they are replaced in Task 5)

Run: `npx tsc --noEmit`
Expected: errors ONLY in `components/sections/Competition.tsx` (`COMPETITION` not exported) and `components/sections/Hero.tsx` (`STATS` shape changed). No errors in `lib/`.

- [ ] **Step 5: Commit**

```bash
git add lib
git commit -m "Update content for Field Log spec, add constellation and tech stack data"
```

---

### Task 3: Sky and atmosphere components

**Files:**
- Modify: `components/Starfield.tsx` (full replace)
- Create: `components/Constellation.tsx`
- Create: `components/CursorGlow.tsx`
- Delete: `components/Sagittarius.tsx`, `components/Reveal.tsx` (deleted in Task 5 when the last importers go away; do not delete here or typecheck breaks)

**Interfaces:**
- Consumes: `CONSTELLATIONS`, `ConstellationName` from `lib/constellations.ts` (Task 2); `.constellation-star` CSS (Task 1).
- Produces: `Starfield()` (no props, client); `Constellation({ name, className?, prominent? })` (server); `CursorGlow()` (no props, client). Task 5 imports all three.

- [ ] **Step 1: Replace `components/Starfield.tsx`** (denser, bigger range, occasional sharp twinkle)

```tsx
"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  twinkler: boolean;
};

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars: Star[] = [];
    let raf = 0;
    let width = 0;
    let height = 0;

    const seed = () => {
      const count = Math.min(450, Math.floor((width * height) / 4500));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.9 + 0.3,
        baseAlpha: Math.random() * 0.6 + 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.008 + 0.002,
        twinkler: Math.random() < 0.08,
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#e8e2d3";
      for (const s of stars) {
        let alpha = reduced
          ? s.baseAlpha
          : s.baseAlpha * (0.65 + 0.35 * Math.sin(s.phase + t * s.speed));
        if (!reduced && s.twinkler) {
          // Occasional sharp flash: a high-powered sine spends most of its
          // period near zero, then spikes briefly.
          const flash = Math.pow(Math.max(0, Math.sin(s.phase + t * s.speed * 2.5)), 12);
          alpha = Math.min(1, alpha + flash * 0.8);
        }
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduced) draw(0);
    };

    const loop = (ms: number) => {
      draw(ms / 16);
      raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!reduced) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
```

- [ ] **Step 2: Create `components/Constellation.tsx`**

```tsx
import { CONSTELLATIONS, type ConstellationName } from "@/lib/constellations";

export default function Constellation({
  name,
  className,
  prominent = false,
}: {
  name: ConstellationName;
  className?: string;
  prominent?: boolean;
}) {
  const { stars, edges } = CONSTELLATIONS[name];
  const lineAlpha = prominent ? 0.22 : 0.12;
  const starAlpha = prominent ? 0.65 : 0.4;

  return (
    <svg
      viewBox="0 0 300 260"
      className={className}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke={`rgba(232, 226, 211, ${lineAlpha})`} strokeWidth="1">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={stars[a][0]}
            y1={stars[a][1]}
            x2={stars[b][0]}
            y2={stars[b][1]}
          />
        ))}
      </g>
      {stars.map(([x, y, r], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill={`rgba(232, 226, 211, ${starAlpha})`}
          className="constellation-star"
          style={{ animationDelay: `${(i % 5) * 0.9}s` }}
        />
      ))}
    </svg>
  );
}
```

- [ ] **Step 3: Create `components/CursorGlow.tsx`** (faint ember light following the pointer; fine pointers only, disabled under reduced motion)

```tsx
"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduced || !fine) return;

    const move = (e: PointerEvent) => {
      el.style.background = `radial-gradient(320px at ${e.clientX}px ${e.clientY}px, rgba(224, 69, 95, 0.06), transparent 70%)`;
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />
  );
}
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: same two pre-existing errors from Task 2 (old Hero/Competition), nothing new.

- [ ] **Step 5: Commit**

```bash
git add components/Starfield.tsx components/Constellation.tsx components/CursorGlow.tsx
git commit -m "Add denser twinkling starfield, data-driven constellations, and cursor glow"
```

---

### Task 4: Logbook sidebar

**Files:**
- Create: `components/Sidebar.tsx`

**Interfaces:**
- Consumes: `SITE` from `lib/content.ts`; `.margin-rule` CSS (Task 1).
- Produces: `Sidebar()` (client component, no props). Renders the desktop fixed sidebar AND the mobile top strip. Section ids it observes: `about`, `projects`, `experience`, `tech`, `contact` (Task 5 must use these ids).

- [ ] **Step 1: Create `components/Sidebar.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/lib/content";

const ENTRIES = [
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "tech", label: "Tech" },
  { id: "contact", label: "Contact" },
];

export default function Sidebar() {
  const [active, setActive] = useState("about");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    for (const { id } of ENTRIES) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Mobile top strip */}
      <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-line bg-void/85 px-5 py-3 backdrop-blur-sm md:hidden">
        <a href="#about" className="font-serif text-lg text-primary">
          {SITE.name}
        </a>
        <a
          href={SITE.resumeHref}
          className="border border-ember/40 px-3 py-1 text-xs uppercase tracking-[0.12em] text-[#f2a3ae] transition-colors hover:border-ember"
        >
          Resume
        </a>
      </header>

      {/* Desktop logbook margin */}
      <aside className="margin-rule fixed inset-y-0 left-0 z-20 hidden w-[180px] flex-col px-6 py-10 max-md:hidden md:flex">
        <a href="#about" className="font-serif text-xl leading-tight text-primary">
          {SITE.name}
        </a>
        <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-brass">
          Observation log
        </p>

        <nav className="mt-12 flex flex-col gap-7">
          {ENTRIES.map(({ id, label }, i) => {
            const current = active === id;
            return (
              <a key={id} href={`#${id}`} className="group block">
                <span
                  className={`block text-[10px] uppercase tracking-[0.14em] transition-colors ${
                    current ? "text-ember" : "text-faint group-hover:text-ember/70"
                  }`}
                >
                  Entry 0{i + 1}
                  {current ? " / Current" : ""}
                </span>
                <span
                  className={`mt-0.5 block text-sm transition-colors ${
                    current
                      ? "font-bold text-primary"
                      : "text-body group-hover:text-primary"
                  }`}
                >
                  {label}
                </span>
              </a>
            );
          })}
        </nav>

        <div className="mt-auto text-[10px] uppercase leading-relaxed tracking-[0.1em] text-faint">
          University of Waterloo
          <br />
          Computer Science
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: same two pre-existing errors, nothing new.

- [ ] **Step 3: Commit**

```bash
git add components/Sidebar.tsx
git commit -m "Add logbook sidebar with scroll-spy entries and mobile strip"
```

---

### Task 5: Sections, page assembly, OG restyle

**Files:**
- Create: `components/sections/About.tsx`
- Modify: `components/sections/Projects.tsx` (full replace)
- Modify: `components/sections/Experience.tsx` (full replace)
- Create: `components/sections/Tech.tsx`
- Modify: `components/sections/Contact.tsx` (full replace)
- Modify: `app/page.tsx` (full replace)
- Modify: `app/opengraph-image.tsx` (full replace)
- Delete: `components/sections/Nav.tsx`, `components/sections/Hero.tsx`, `components/sections/Competition.tsx`, `components/Sagittarius.tsx`, `components/Reveal.tsx`

**Interfaces:**
- Consumes: everything produced by Tasks 1-4.
- Produces: five section server components, ids `about` / `projects` / `experience` / `tech` / `contact` matching Sidebar's ENTRIES.

- [ ] **Step 1: Create `components/sections/About.tsx`**

```tsx
import { SITE, STATS } from "@/lib/content";
import Constellation from "@/components/Constellation";

export default function About() {
  return (
    <section id="about" className="relative scroll-mt-24 py-24 md:py-32">
      {/* Stationary ember bloom behind Sagittarius */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 right-0 h-[420px] w-[420px] max-md:hidden"
        style={{
          background:
            "radial-gradient(closest-side, rgba(224, 69, 95, 0.07), transparent 70%)",
        }}
      />
      <Constellation
        name="sagittarius"
        prominent
        className="pointer-events-none absolute top-0 right-4 w-72 max-md:hidden lg:w-80"
      />

      <p className="text-xs uppercase tracking-[0.14em] text-brass">
        {SITE.identity}
      </p>
      <h1 className="mt-5 font-serif text-5xl text-primary sm:text-7xl">
        {SITE.name}
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-primary/90 sm:text-xl">
        {SITE.tagline}
      </p>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-body">
        {SITE.sub}
      </p>

      <div className="mt-12 flex flex-wrap gap-x-12 gap-y-8">
        {STATS.map((s) => (
          <div key={s.eyebrow} className="border-l-2 border-ember pl-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-brass">
              {s.eyebrow}
            </div>
            <div className="mt-1 font-serif text-2xl text-primary">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-6">
        <a
          href={SITE.resumeHref}
          className="border border-ember bg-ember/10 px-6 py-3 text-sm text-[#f2a3ae] shadow-[0_0_14px_rgba(224,69,95,0.25)] transition-shadow hover:shadow-[0_0_22px_rgba(224,69,95,0.4)]"
        >
          View Resume
        </a>
        <a
          href={SITE.github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-body underline decoration-line underline-offset-4 transition-colors hover:text-ember"
        >
          GitHub
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Replace `components/sections/Projects.tsx`** (rows, no cards; OlympIQ current)

```tsx
import { FLAGSHIP, PROJECTS, SITE, type Project } from "@/lib/content";
import Constellation from "@/components/Constellation";

function Row({ p, current = false }: { p: Project; current?: boolean }) {
  return (
    <div
      className={`group border-t border-white/8 py-7 pl-5 transition-colors ${
        current
          ? "border-l-2 border-l-ember bg-gradient-to-r from-ember/8 to-transparent"
          : "border-l-2 border-l-ember/35 hover:border-l-ember"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="font-serif text-2xl text-primary">{p.name}</h3>
        <span
          className={`text-xs tracking-[0.08em] transition-colors ${
            current ? "text-ember" : "text-brass group-hover:text-ember"
          }`}
        >
          {p.coord}
        </span>
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-dim">
        {p.context}
        {p.award ? ` / ${p.award}` : ""}
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-body">
        {p.description}
      </p>
      <p className="mt-3 text-xs text-dim">{p.tech.join(" / ")}</p>
      <div className="mt-3 flex gap-6 text-xs uppercase tracking-[0.1em]">
        {p.live && (
          <a
            href={p.live}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline decoration-ember/60 underline-offset-4 transition-colors hover:text-ember"
          >
            olympiq.ca
          </a>
        )}
        {p.github && (
          <a
            href={p.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-dim transition-colors hover:text-ember"
          >
            Source
          </a>
        )}
      </div>
    </div>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="relative scroll-mt-24 py-20">
      <Constellation
        name="ursaMajor"
        className="pointer-events-none absolute top-8 right-0 w-64 max-md:hidden"
      />
      <h2 className="font-serif text-3xl text-primary">Projects</h2>
      <div className="mt-8">
        <Row p={FLAGSHIP} current />
        {PROJECTS.map((p) => (
          <Row key={p.name} p={p} />
        ))}
      </div>
      <a
        href={SITE.github}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-block text-xs uppercase tracking-[0.1em] text-dim transition-colors hover:text-ember"
      >
        More on GitHub
      </a>
    </section>
  );
}
```

- [ ] **Step 3: Replace `components/sections/Experience.tsx`** (results list + org entries under one heading)

```tsx
import { EXPERIENCE, RESULTS } from "@/lib/content";
import Constellation from "@/components/Constellation";

export default function Experience() {
  return (
    <section id="experience" className="relative scroll-mt-24 py-20">
      <Constellation
        name="cygnus"
        className="pointer-events-none absolute top-10 right-6 w-52 max-md:hidden"
      />
      <h2 className="font-serif text-3xl text-primary">Experience</h2>

      <p className="mt-6 max-w-xl text-sm leading-relaxed text-body">
        Competitive programming since grade nine. 500+ problems solved across
        DMOJ, Codeforces, and USACO.
      </p>
      <ul className="mt-6 border-y border-white/8">
        {RESULTS.map((r) => (
          <li
            key={r.event}
            className="group grid grid-cols-2 gap-2 border-t border-white/8 py-3 first:border-t-0 sm:grid-cols-[1fr_1fr_auto]"
          >
            <span className="text-sm text-primary">{r.event}</span>
            <span className="text-sm text-body transition-colors group-hover:text-primary">
              {r.result}
            </span>
            <span className="text-xs text-brass transition-colors group-hover:text-ember max-sm:col-span-2">
              {r.year}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-14 space-y-12">
        {EXPERIENCE.map((e) => (
          <div key={e.org} className="group grid gap-2 sm:grid-cols-[200px_1fr] sm:gap-8">
            <div className="text-xs uppercase tracking-[0.1em] text-dim">
              {e.period}
            </div>
            <div className="border-l-2 border-ember/35 pl-5 transition-colors group-hover:border-ember">
              <h3 className="font-serif text-xl text-primary">{e.org}</h3>
              <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-brass">
                {e.role}
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-body">
                {e.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `components/sections/Tech.tsx`** (brand-colored icons, dimmed until hover)

```tsx
import { TECH_STACK } from "@/lib/techstack";
import Constellation from "@/components/Constellation";

export default function Tech() {
  return (
    <section id="tech" className="relative scroll-mt-24 py-20">
      <Constellation
        name="orion"
        className="pointer-events-none absolute top-6 right-2 w-56 max-md:hidden"
      />
      <h2 className="font-serif text-3xl text-primary">Tech</h2>
      <div className="mt-8 grid grid-cols-3 gap-px bg-white/5 sm:grid-cols-4 lg:grid-cols-5">
        {TECH_STACK.map((t) => (
          <div
            key={t.name}
            className="group flex flex-col items-center gap-3 bg-void px-4 py-6 transition-colors hover:bg-[#0a0c14]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 opacity-35 grayscale transition-all duration-200 group-hover:opacity-100 group-hover:grayscale-0"
              fill={t.hex}
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d={t.path} />
            </svg>
            <span className="text-[10px] uppercase tracking-[0.1em] text-dim transition-colors group-hover:text-body">
              {t.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Replace `components/sections/Contact.tsx`**

```tsx
import { SITE } from "@/lib/content";
import Constellation from "@/components/Constellation";

export default function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-24 py-20">
      <Constellation
        name="gemini"
        className="pointer-events-none absolute top-4 right-8 w-48 max-md:hidden"
      />
      <h2 className="font-serif text-3xl text-primary">Contact</h2>
      <p className="mt-6 max-w-xl font-serif text-2xl leading-snug text-primary/90">
        Looking for a Summer 2027 co-op. If you&apos;re building something
        interesting, I&apos;d like to hear about it.
      </p>
      <div className="mt-8 flex flex-wrap gap-8 text-sm">
        <a
          href={`mailto:${SITE.email}`}
          className="text-primary underline decoration-ember/60 underline-offset-4 transition-colors hover:text-ember"
        >
          {SITE.email}
        </a>
        <a
          href={SITE.github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-body transition-colors hover:text-ember"
        >
          GitHub
        </a>
        <a
          href={SITE.resumeHref}
          className="text-body transition-colors hover:text-ember"
        >
          Resume
        </a>
      </div>
      <footer className="mt-24 border-t border-line pt-6 text-[10px] uppercase tracking-[0.1em] text-faint">
        © {new Date().getFullYear()} Andrew Li. Built with Next.js.
      </footer>
    </section>
  );
}
```

- [ ] **Step 6: Replace `app/page.tsx`** (sidebar layout + grid layer over main column only)

```tsx
import Starfield from "@/components/Starfield";
import CursorGlow from "@/components/CursorGlow";
import Sidebar from "@/components/Sidebar";
import About from "@/components/sections/About";
import Projects from "@/components/sections/Projects";
import Experience from "@/components/sections/Experience";
import Tech from "@/components/sections/Tech";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <div>
      <Starfield />
      <CursorGlow />
      <Sidebar />
      <main className="relative md:ml-[180px]">
        <div aria-hidden="true" className="coord-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-4xl px-6 pt-16 md:px-14 md:pt-0">
          <About />
          <Projects />
          <Experience />
          <Tech />
          <Contact />
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 7: Replace `app/opengraph-image.tsx`**

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Andrew Li, Computer Science student at the University of Waterloo";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#07080d",
          color: "#eceef4",
          fontSize: 40,
        }}
      >
        <div
          style={{
            color: "#a8895a",
            fontSize: 24,
            fontFamily: "monospace",
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Observation log
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 16 }}>
          Andrew Li
        </div>
        <div
          style={{
            width: 64,
            height: 4,
            backgroundColor: "#e0455f",
            marginTop: 28,
          }}
        />
        <div style={{ color: "#828aa3", marginTop: 28, maxWidth: 900, fontSize: 34 }}>
          Computer Science student at the University of Waterloo.
        </div>
        <div
          style={{
            color: "#6a7088",
            fontSize: 24,
            marginTop: 48,
            fontFamily: "monospace",
          }}
        >
          andrewli.app
        </div>
      </div>
    ),
    size
  );
}
```

- [ ] **Step 8: Delete dead components**

Run: `rm components/sections/Nav.tsx components/sections/Hero.tsx components/sections/Competition.tsx components/Sagittarius.tsx components/Reveal.tsx`

- [ ] **Step 9: Build**

Run: `npm run build`
Expected: clean build, `/` static.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Rebuild site as Field Log theme with sidebar, rows, tech stack, and per-section constellations"
```

---

### Task 6: Full verification pass

**Files:** none new; fixes only.

- [ ] **Step 1: Lint and build**

Run: `npm run lint && npm run build`
Expected: both clean.

- [ ] **Step 2: Preview checks** (server config `dev` already exists in `.claude/launch.json`)
  - Desktop screenshot at top: sidebar with name/OBSERVATION LOG/entries, "ENTRY 01 / CURRENT" on About, coordinate grid visible, denser starfield with visibly larger stars, Sagittarius + ember bloom top right, square CTA panel.
  - Scroll to Projects/Experience/Tech/Contact (via `preview_eval` scrollIntoView) and confirm the sidebar CURRENT marker follows; screenshot Projects (rows not cards, OlympIQ red wash) and Tech (icon grid).
  - Hover check via `preview_eval` forced `:hover` is unreliable; instead verify hover classes exist in DOM (`group-hover:` classes present) and visually spot-check one screenshot with mouse over a row if possible.
  - Mobile 375px: top strip shows name + Resume, no sidebar, no constellations, no horizontal overflow.
  - `/resume.pdf` returns 200; console has zero errors.
- [ ] **Step 3: Copy audit**

Run: `grep -rn "—" app components lib | grep -v node_modules`; expect no hits.
Run: `grep -rin "linkedin\|incoming\|class of 2031\|max rating\|missions\|trajectory\|sightings" app components lib`; expect no hits.

- [ ] **Step 4: Commit fixes if any**

```bash
git add -A
git commit -m "Fix issues found in Field Log verification pass"
```
