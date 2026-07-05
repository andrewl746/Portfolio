# Portfolio Site + Co-op Resume Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the single-page portfolio at andrewli.app in this repo and produce Andrew's rewritten one-page co-op resume as .docx plus a PDF served by the site.

**Architecture:** Static Next.js App Router site: one page assembled from server components in `components/sections/`, content centralized in `lib/content.ts`, two small client components (canvas starfield, scroll reveal), one inline SVG constellation. Resume is authored via the docx skill and exported to `public/resume.pdf`.

**Tech Stack:** Next.js 16.2.10 (App Router), React 19, TypeScript, Tailwind CSS 4, Geist/Geist Mono via next/font, next/og for the OG image, anthropic-skills:docx for the resume.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-05-portfolio-and-resume-design.md`. Content facts there are the source of truth; do not invent metrics.
- Copy rules: **no em dashes anywhere** (site, resume, commit-visible copy), no generic AI-sounding filler. No LinkedIn references.
- Palette: background `#08080c`, foreground `#ececf1`, muted `#8a8a94`, card `#0d0d13`, border `#1c1c24`, accent crimson `#e04654`. Accent used sparingly.
- Only one constellation: Sagittarius. Respect `prefers-reduced-motion` in every animation.
- This repo's Next.js may differ from training data; if an API errors, check `node_modules/next/dist/docs/` before improvising.
- No new npm dependencies.
- No test framework exists and the site has no logic worth unit-testing; each task's verification is `npm run build` (must pass with zero errors) plus visual checks in the final task.
- Windows environment; use the Bash tool with forward-slash paths or PowerShell as noted.

---

### Task 1: Theme, layout shell, metadata, favicon

**Files:**
- Modify: `app/globals.css` (full replace)
- Modify: `app/layout.tsx` (full replace)
- Create: `app/icon.svg`
- Delete: `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg`

**Interfaces:**
- Produces: CSS variables/Tailwind colors `background`, `foreground`, `muted`, `accent`, `card`, `line` (usable as `text-muted`, `border-line`, `text-accent`, `bg-card` etc.); CSS classes `.reveal`/`.revealed`, `.constellation-star`; fonts `--font-geist-sans` (default sans) and `--font-geist-mono` (`font-mono`). All later tasks rely on these exact names.

- [ ] **Step 1: Replace `app/globals.css`**

```css
@import "tailwindcss";

:root {
  --background: #08080c;
  --foreground: #ececf1;
  --muted: #8a8a94;
  --accent: #e04654;
  --card: #0d0d13;
  --border: #1c1c24;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-card: var(--card);
  --color-line: var(--border);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
}

::selection {
  background: rgba(224, 70, 84, 0.35);
}

.reveal {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.reveal.revealed {
  opacity: 1;
  transform: none;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

.constellation-star {
  animation: twinkle 4.5s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .reveal { opacity: 1; transform: none; transition: none; }
  .constellation-star { animation: none; }
}
```

- [ ] **Step 2: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://andrewli.app"),
  title: "Andrew Li",
  description:
    "Incoming Computer Science student at the University of Waterloo, class of 2031. Builder of OlympIQ and other tools that make people's lives a little easier.",
  openGraph: {
    title: "Andrew Li",
    description:
      "Incoming Computer Science student at the University of Waterloo, class of 2031. Builder of OlympIQ and other tools that make people's lives a little easier.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Create `app/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#08080c"/><path d="M32 12l4.5 15.5L52 32l-15.5 4.5L32 52l-4.5-15.5L12 32l15.5-4.5z" fill="#e04654"/></svg>
```

- [ ] **Step 4: Delete starter SVGs**

Run: `rm public/next.svg public/vercel.svg public/file.svg public/globe.svg public/window.svg`

Note: `app/page.tsx` still references two of these; the build will fail until Task 5 replaces it. That is expected mid-task-sequence, so verify this task with lint only:

Run: `npm run lint`
Expected: no errors about the changed files (page.tsx untouched so far and still compiles as TS).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add dark observatory theme, site metadata, and favicon"
```

---

### Task 2: Content module

**Files:**
- Create: `lib/content.ts`

**Interfaces:**
- Produces (exact exports later tasks import):
  - `SITE = { name, tagline, sub, email, github, resumeHref }`
  - `STATS: { value: string; label: string }[]`
  - `FLAGSHIP: Project` and `PROJECTS: Project[]` where `type Project = { name: string; context: string; description: string; tech: string[]; github?: string; live?: string; award?: string }`
  - `COMPETITION: { event: string; result: string; year: string }[]`
  - `EXPERIENCE: { org: string; role: string; period: string; bullets: string[] }[]`

- [ ] **Step 1: Create `lib/content.ts`**

```ts
export type Project = {
  name: string;
  context: string;
  description: string;
  tech: string[];
  github?: string;
  live?: string;
  award?: string;
};

export const SITE = {
  name: "Andrew Li",
  tagline: "I enjoy building software that makes people's lives a little easier.",
  sub: "Incoming Computer Science student at the University of Waterloo, class of 2031. Currently building OlympIQ, the platform my school's Science Olympics program runs on.",
  email: "andrewli746@gmail.com",
  github: "https://github.com/andrewl746",
  resumeHref: "/resume.pdf",
};

export const STATS = [
  { value: "3x", label: "CCC Senior distinction" },
  { value: "500+", label: "problems solved" },
  { value: "4", label: "hackathons" },
];

export const FLAGSHIP: Project = {
  name: "OlympIQ",
  context: "Live at olympiq.ca",
  description:
    "Science Olympics, minus the spreadsheets. OlympIQ runs my school's Science Olympics program end to end: event schedules with automatic conflict detection and Excel export, preference-based competitor-to-event assignment, shared materials, and attendance tracking. Teachers, executives, and competitors each get their own role, joined by team code.",
  tech: ["Next.js", "TypeScript", "Firebase", "Firestore"],
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
    github: "https://github.com/andrewl746/Flowboard",
  },
  {
    name: "TeacherAId",
    context: "GenAI Genesis 2026",
    description:
      "Reads student reasoning, not just their answers. Classifies misconceptions from written explanations, builds per-student profiles and class-wide analytics, and tells teachers what to reteach next.",
    tech: ["Firebase", "Claude API", "Cloudflare Workers"],
    github: "https://github.com/andrewl746/TeacherAId",
  },
  {
    name: "FrostByte",
    context: "Hack Canada 2025",
    description:
      "Estimates frostbite and hypothermia risk from live weather and what you're wearing, then tells you how long you can safely stay outside.",
    tech: ["Next.js", "Node.js", "Firebase", "Gemini API"],
    github: "https://github.com/andrewl746/FrostByte",
    award: "Best Use of Gemini AI",
  },
  {
    name: "CourtManager",
    context: "IB HL CS Internal Assessment",
    description:
      "Team management for my school's tennis doubles squad, with a custom merge-sort based pairing algorithm, player records, and lineup planning.",
    tech: ["Java", "Spring Boot", "JavaScript"],
    github: "https://github.com/andrewl746/CourtManager",
  },
];

export const COMPETITION = [
  { event: "CCC Senior", result: "Distinction", year: "2024, 2025, 2026" },
  { event: "USACO", result: "Silver Division", year: "2024" },
  { event: "DMOJ", result: "Top 2%, 300+ points", year: "ongoing" },
  { event: "Codeforces", result: "Max rating 1200+", year: "ongoing" },
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

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: exits 0 (page.tsx unchanged and still valid TS even though public SVGs are gone).

- [ ] **Step 3: Commit**

```bash
git add lib/content.ts
git commit -m "Add site content module"
```

---

### Task 3: Starfield, Sagittarius, and Reveal components

**Files:**
- Create: `components/Starfield.tsx`
- Create: `components/Sagittarius.tsx`
- Create: `components/Reveal.tsx`

**Interfaces:**
- Consumes: `.reveal`/`.revealed`/`.constellation-star` CSS from Task 1.
- Produces: default exports `Starfield()` (no props), `Sagittarius({ className? })`, `Reveal({ children, className? })`. Task 5 imports all three.

- [ ] **Step 1: Create `components/Starfield.tsx`**

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
      const count = Math.min(220, Math.floor((width * height) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.1 + 0.3,
        baseAlpha: Math.random() * 0.5 + 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.008 + 0.002,
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#e8e8f0";
      for (const s of stars) {
        const alpha = reduced
          ? s.baseAlpha
          : s.baseAlpha * (0.6 + 0.4 * Math.sin(s.phase + t * s.speed));
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

- [ ] **Step 2: Create `components/Sagittarius.tsx`** (server component, the Teapot asterism: spout Alnasl, body Kaus Media/Kaus Australis/Ascella/Phi Sgr, lid Kaus Borealis, handle Nunki/Tau Sgr)

```tsx
const STARS: [number, number, number][] = [
  [40, 150, 3],
  [95, 130, 3.5],
  [85, 195, 4],
  [135, 75, 3.5],
  [185, 110, 3],
  [230, 85, 4],
  [250, 130, 3],
  [215, 170, 3.5],
];

const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 3],
  [3, 4],
  [4, 1],
  [4, 7],
  [7, 2],
  [4, 5],
  [5, 6],
  [6, 7],
];

export default function Sagittarius({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 260"
      className={className}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="rgba(224, 70, 84, 0.3)" strokeWidth="1">
        {EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={STARS[a][0]}
            y1={STARS[a][1]}
            x2={STARS[b][0]}
            y2={STARS[b][1]}
          />
        ))}
      </g>
      {STARS.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r * 2.4} fill="rgba(224, 70, 84, 0.12)" />
          <circle
            cx={x}
            cy={y}
            r={r}
            fill="#f0e9ea"
            className="constellation-star"
            style={{ animationDelay: `${i * 0.7}s` }}
          />
        </g>
      ))}
    </svg>
  );
}
```

- [ ] **Step 3: Create `components/Reveal.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";

export default function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add components
git commit -m "Add starfield, Sagittarius constellation, and scroll reveal components"
```

---

### Task 4: Section components

**Files:**
- Create: `components/sections/Nav.tsx`
- Create: `components/sections/Hero.tsx`
- Create: `components/sections/Projects.tsx`
- Create: `components/sections/Competition.tsx`
- Create: `components/sections/Experience.tsx`
- Create: `components/sections/Contact.tsx`

**Interfaces:**
- Consumes: `lib/content.ts` exports (Task 2), `Sagittarius` and `Reveal` (Task 3), theme colors (Task 1).
- Produces: default-export server components with no props: `Nav`, `Hero`, `Projects`, `Competition`, `Experience`, `Contact`. Task 5 imports all six. Section ids: `projects`, `competition`, `experience`, `contact`.

- [ ] **Step 1: Create `components/sections/Nav.tsx`**

```tsx
import { SITE } from "@/lib/content";

const LINKS = [
  ["projects", "#projects"],
  ["competition", "#competition"],
  ["experience", "#experience"],
  ["contact", "#contact"],
] as const;

export default function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/60 bg-background/70 backdrop-blur-md">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a href="#top" className="font-semibold tracking-tight">
          {SITE.name.toLowerCase()}
        </a>
        <div className="flex items-center gap-6 font-mono text-sm text-muted">
          {LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="transition-colors hover:text-accent max-sm:hidden"
            >
              {label}
            </a>
          ))}
          <a
            href={SITE.resumeHref}
            className="rounded-md border border-accent/40 px-3 py-1.5 text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            resume
          </a>
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Create `components/sections/Hero.tsx`**

```tsx
import { SITE, STATS } from "@/lib/content";
import Sagittarius from "@/components/Sagittarius";

export default function Hero() {
  return (
    <section className="relative mx-auto max-w-5xl px-6 pb-24 pt-28 sm:pt-36">
      <Sagittarius className="pointer-events-none absolute -top-4 right-0 w-64 opacity-80 max-md:hidden lg:w-80" />
      <p className="font-mono text-sm text-accent">
        waterloo cs, class of 2031
      </p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-7xl">
        {SITE.name}
      </h1>
      <p className="mt-6 max-w-xl text-xl leading-relaxed text-foreground/90 sm:text-2xl">
        {SITE.tagline}
      </p>
      <p className="mt-4 max-w-xl leading-relaxed text-muted">{SITE.sub}</p>
      <div className="mt-10 flex flex-wrap gap-x-10 gap-y-6">
        {STATS.map((s) => (
          <div key={s.label}>
            <div className="text-2xl font-semibold">{s.value}</div>
            <div className="mt-1 font-mono text-sm text-muted">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-wrap gap-4">
        <a
          href={SITE.resumeHref}
          className="rounded-md bg-accent px-5 py-2.5 font-medium text-background transition-opacity hover:opacity-85"
        >
          View resume
        </a>
        <a
          href={SITE.github}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-line px-5 py-2.5 font-medium text-foreground transition-colors hover:border-accent/60"
        >
          GitHub
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `components/sections/Projects.tsx`**

```tsx
import { FLAGSHIP, PROJECTS, SITE } from "@/lib/content";
import Reveal from "@/components/Reveal";

function TechTags({ tech }: { tech: string[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tech.map((t) => (
        <span
          key={t}
          className="rounded border border-line px-2 py-0.5 font-mono text-xs text-muted"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20">
      <Reveal>
        <h2 className="font-mono text-sm text-accent">01 / projects</h2>

        <div className="mt-8 rounded-xl border border-accent/25 bg-card p-8 transition-colors hover:border-accent/50">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-2xl font-semibold">{FLAGSHIP.name}</h3>
            <span className="font-mono text-xs text-accent">
              {FLAGSHIP.context}
            </span>
          </div>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">
            {FLAGSHIP.description}
          </p>
          <TechTags tech={FLAGSHIP.tech} />
          <div className="mt-5 flex gap-5 font-mono text-sm">
            <a
              href={FLAGSHIP.live}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline decoration-accent/60 underline-offset-4 transition-colors hover:text-accent"
            >
              olympiq.ca
            </a>
            <a
              href={FLAGSHIP.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted transition-colors hover:text-accent"
            >
              source
            </a>
          </div>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {PROJECTS.map((p) => (
          <Reveal key={p.name}>
            <div className="flex h-full flex-col rounded-xl border border-line bg-card p-6 transition-colors hover:border-accent/40">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <span className="font-mono text-xs text-muted">{p.context}</span>
              </div>
              {p.award && (
                <p className="mt-2 font-mono text-xs text-accent">
                  ★ {p.award}
                </p>
              )}
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                {p.description}
              </p>
              <TechTags tech={p.tech} />
              {p.github && (
                <a
                  href={p.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 font-mono text-sm text-muted transition-colors hover:text-accent"
                >
                  source
                </a>
              )}
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <a
          href={SITE.github}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block font-mono text-sm text-muted transition-colors hover:text-accent"
        >
          more on github
        </a>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 4: Create `components/sections/Competition.tsx`**

```tsx
import { COMPETITION } from "@/lib/content";
import Reveal from "@/components/Reveal";

export default function Competition() {
  return (
    <section
      id="competition"
      className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20"
    >
      <Reveal>
        <h2 className="font-mono text-sm text-accent">02 / competition</h2>
        <p className="mt-6 max-w-xl leading-relaxed text-muted">
          Competitive programming since grade nine. 500+ problems solved across
          DMOJ, Codeforces, and USACO.
        </p>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {COMPETITION.map((c) => (
            <li
              key={c.event}
              className="grid grid-cols-2 gap-2 py-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <span className="font-medium">{c.event}</span>
              <span className="text-muted">{c.result}</span>
              <span className="font-mono text-sm text-muted max-sm:col-span-2">
                {c.year}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 5: Create `components/sections/Experience.tsx`**

```tsx
import { EXPERIENCE } from "@/lib/content";
import Reveal from "@/components/Reveal";

export default function Experience() {
  return (
    <section
      id="experience"
      className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20"
    >
      <Reveal>
        <h2 className="font-mono text-sm text-accent">03 / experience</h2>
      </Reveal>
      <div className="mt-8 space-y-10">
        {EXPERIENCE.map((e) => (
          <Reveal key={e.org}>
            <div className="grid gap-2 sm:grid-cols-[220px_1fr] sm:gap-8">
              <div>
                <div className="font-mono text-sm text-muted">{e.period}</div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{e.org}</h3>
                <div className="mt-1 text-sm text-accent">{e.role}</div>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
                  {e.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Create `components/sections/Contact.tsx`**

```tsx
import { SITE } from "@/lib/content";
import Reveal from "@/components/Reveal";

export default function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20">
      <Reveal>
        <h2 className="font-mono text-sm text-accent">04 / contact</h2>
        <p className="mt-6 max-w-xl text-xl leading-relaxed">
          Looking for a Summer 2027 co-op. If you're building something
          interesting, I'd like to hear about it.
        </p>
        <div className="mt-8 flex flex-wrap gap-6 font-mono text-sm">
          <a
            href={`mailto:${SITE.email}`}
            className="text-foreground underline decoration-accent/60 underline-offset-4 transition-colors hover:text-accent"
          >
            {SITE.email}
          </a>
          <a
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted transition-colors hover:text-accent"
          >
            github
          </a>
          <a
            href={SITE.resumeHref}
            className="text-muted transition-colors hover:text-accent"
          >
            resume
          </a>
        </div>
      </Reveal>
      <footer className="mt-24 border-t border-line pt-6 font-mono text-xs text-muted">
        © {new Date().getFullYear()} Andrew Li. Built with Next.js.
      </footer>
    </section>
  );
}
```

- [ ] **Step 7: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 8: Commit**

```bash
git add components/sections
git commit -m "Add nav, hero, projects, competition, experience, and contact sections"
```

---

### Task 5: Assemble the page and OG image

**Files:**
- Modify: `app/page.tsx` (full replace)
- Create: `app/opengraph-image.tsx`

**Interfaces:**
- Consumes: all six section components (Task 4), `Starfield` (Task 3).

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
import Starfield from "@/components/Starfield";
import Nav from "@/components/sections/Nav";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import Competition from "@/components/sections/Competition";
import Experience from "@/components/sections/Experience";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <div id="top">
      <Starfield />
      <Nav />
      <main>
        <Hero />
        <Projects />
        <Competition />
        <Experience />
        <Contact />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/opengraph-image.tsx`**

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Andrew Li, incoming Waterloo CS student";

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
          backgroundColor: "#08080c",
          color: "#ececf1",
          fontSize: 40,
        }}
      >
        <div style={{ color: "#e04654", fontSize: 28, fontFamily: "monospace" }}>
          waterloo cs, class of 2031
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 16 }}>
          Andrew Li
        </div>
        <div style={{ color: "#8a8a94", marginTop: 24, maxWidth: 900 }}>
          I enjoy building software that makes people's lives a little easier.
        </div>
        <div style={{ color: "#8a8a94", fontSize: 26, marginTop: 48, fontFamily: "monospace" }}>
          andrewli.app
        </div>
      </div>
    ),
    size
  );
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds, `/` prerendered as static. If `next/og` import fails, check `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/image-response.md` for the correct import path in this version.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/opengraph-image.tsx
git commit -m "Assemble single-page portfolio and add OG image"
```

---

### Task 6: Resume content as .docx

**Files:**
- Create: `resume/Andrew Li Resume.docx` (via anthropic-skills:docx; keep generation script if the skill produces one under `resume/`)

**Interfaces:**
- Produces: the .docx used in Task 7 to export `public/resume.pdf`.

- [ ] **Step 1: Invoke the docx skill** (REQUIRED SUB-SKILL: anthropic-skills:docx) and produce a one-page, single-column, ATS-safe resume. No tables for layout, no images, no em dashes. Margins ~0.5in, font Calibri or similar 10.5 to 11pt, name heading larger. Exact content:

**Header:** Andrew Li | PHONE_REMOVED | andrewli746@gmail.com | github.com/andrewl746 | andrewli.app

**EDUCATION**
- University of Waterloo, Waterloo, ON. Candidate for Bachelor of Computer Science (Honours, Co-op), Sep 2026 to Apr 2031. Seeking Summer 2027 internship (first work term).
- Victoria Park Collegiate Institute, Toronto, ON. IB Diploma, Sep 2022 to Jun 2026.

**PROJECTS**

*OlympIQ | Next.js, TypeScript, Firebase, Firestore | olympiq.ca* (Sep 2025 to present)
- Built and launched a Science Olympics team-management platform now used by my school's program, with role-based access for teachers, executives, and competitors.
- Implemented event scheduling with automatic conflict detection and Excel export, and preference-based automatic competitor-to-event assignment.
- Shipped solo from design to production across 100+ commits, including Firestore security rules and role-based onboarding with team codes.

*Flowboard | Next.js, React 19, TypeScript, React Flow, Zustand, Anthropic API* (JamHacks 2026)
- Built a codebase onboarding tool that scans a GitHub repository and renders folders, files, and functions as an interactive dependency graph.
- Grounded an AI assistant in repository context (file hierarchy, visible graph nodes, and code excerpts) so answers reference the actual codebase rather than generic advice.
- Integrated GitHub OAuth for authenticated repository scanning.

*TeacherAId | Firebase, Firestore, Claude API, Cloudflare Workers* (GenAI Genesis 2026)
- Built a classroom analytics platform that classifies misconceptions from students' written reasoning and aggregates them into class-wide dashboards with reteach suggestions.
- Proxied Claude API calls through a Cloudflare Worker to keep credentials server-side, with rate limiting and Firebase App Check.
- Added adaptive question generation that targets the class's weakest concepts automatically.

*FrostByte | Next.js, Node.js, Firebase, Gemini API* (Hack Canada 2025)
- Won Best Use of Gemini AI or Gemini API for a web app that estimates frostbite and hypothermia risk from live weather and clothing input, with safe-exposure time limits.

**EXPERIENCE**

*Kurius (nonprofit), C++ Instructor and Outreach Coordinator, Remote* (Dec 2023 to present)
- Taught a 5-week Introduction to C++ course to university students; students progressed from no C++ experience to writing functional programs.
- Coordinate sponsor and partnership outreach supporting free technology education programs.

*Science Olympics Club, Victoria Park CI, Head Trainer* (Sep 2023 to Jun 2026)
- Led a team of 6 trainers; all 4 junior teams coached placed 1st at Western University's Science Olympics.
- Designed the club's first structured training program and recruited experienced competitors as trainers, then built OlympIQ to run scheduling and signups.

**AWARDS**
- Canadian Computing Competition (Senior): Distinction, 2024, 2025, 2026
- USACO Silver Division; DMOJ top 2% (300+ points); Codeforces max rating 1200+; 500+ problems solved
- Best Use of Gemini AI or Gemini API, Hack Canada 2025
- 1st place team, St. Lawrence Coding Competition 2024

**SKILLS**
- Languages: C++, Java, Python, TypeScript, JavaScript, HTML/CSS
- Frameworks and tools: React, Next.js, Node.js, Tailwind CSS, Firebase, Cloudflare Workers, Spring Boot, Git/GitHub

- [ ] **Step 2: Verify one page**

Open/inspect the generated docx (docx skill validation or convert to PDF and count pages). Expected: exactly 1 page. If it overflows, trim the Flowboard OAuth bullet first, then TeacherAId's third bullet.

- [ ] **Step 3: Commit**

```bash
git add resume
git commit -m "Add rewritten co-op resume"
```

---

### Task 7: Resume PDF on the site

**Files:**
- Create: `public/resume.pdf` (exported from Task 6 docx)

- [ ] **Step 1: Export PDF from the docx.** Preferred: Word COM via PowerShell:

```powershell
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open("C:\Users\Andrew\Programming\Andrew Li Portfolio\resume\Andrew Li Resume.docx")
$doc.SaveAs([ref] "C:\Users\Andrew\Programming\Andrew Li Portfolio\public\resume.pdf", [ref] 17)
$doc.Close()
$word.Quit()
```

If Word is not installed (COM object creation fails), use the docx skill's PDF export path if available; if neither works, tell the user to export the PDF manually and continue.

- [ ] **Step 2: Verify the file exists and opens**

Run: `ls -la public/resume.pdf`
Expected: file present, nonzero size. Read it with the Read tool to confirm it renders and is 1 page.

- [ ] **Step 3: Commit**

```bash
git add public/resume.pdf
git commit -m "Serve resume PDF at /resume.pdf"
```

---

### Task 8: Full verification pass

**Files:** none created; fixes only if issues found.

- [ ] **Step 1: Lint and build**

Run: `npm run lint && npm run build`
Expected: both pass clean.

- [ ] **Step 2: Visual verification via preview** (create `.claude/launch.json` with `{"version":"0.0.1","configurations":[{"name":"dev","runtimeExecutable":"npm","runtimeArgs":["run","dev"],"port":3000}]}` and use the preview tools)
  - Desktop 1280px: screenshot; check hero with Sagittarius on the right, stat chips, crimson used sparingly, starfield visible.
  - Mobile 375px: screenshot; nav collapses to name + resume button, constellation hidden, no horizontal overflow.
  - Click nav anchors; each section scrolls into view with reveal animation.
  - `preview_resize` with dark scheme unnecessary (site is always dark) but check `prefers-reduced-motion` note manually in code review.
  - Verify `/resume.pdf` loads (check network 200).
  - Console: zero errors.

- [ ] **Step 3: Copy audit**

Grep the built pages/components for em dashes: `grep -rn "—" app components lib resume docs/superpowers/plans` should return nothing outside historical spec text. Also confirm no "LinkedIn" anywhere: `grep -rin linkedin app components lib` returns nothing.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "Fix issues found in verification pass"
```

(Skip if nothing changed.)
