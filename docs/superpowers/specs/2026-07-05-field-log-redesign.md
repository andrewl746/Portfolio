# andrewli.app Field Log Redesign — Design Spec

Date: 2026-07-05
Status: Approved pending user review
Supersedes the visual design in `2026-07-05-portfolio-and-resume-design.md`. Content facts there remain authoritative except where amended below.

## Goal

Rebuild the one-page portfolio's presentation as an astronomer's field log per the user's attached design spec ("Field Log" theme), with the user's amendments. Resume deliverables are unchanged (docx/PDF stay as-is); only the site and its OG image change.

## Content amendments (override previous spec)

- No "incoming" and no "class of 2031" anywhere. Identity line: "Computer Science student at the University of Waterloo."
- Codeforces shown as "Rating 1200+" (never "max rating").
- Add CALICO Bronze, 2024 to competition results.
- Hero stat blocks: "500+ problems solved", "OlympIQ founder", "4 hackathons". CCC distinctions move entirely to the Experience/results section.
- No all-lowercase styling. Normal sentence case; mono labels are UPPERCASE with 0.08–0.14em tracking.
- Observatory vocabulary: structure themed, words plain. Section names are About, Projects, Experience, Tech, Contact. No "Missions", "Trajectory", or "Logged Sightings". Theme lives only in visuals (log-entry nav, coordinates, grid, constellations).
- Everything else (project descriptions, experience bullets, contact copy, no em dashes, no LinkedIn) carries over from the previous spec and `lib/content.ts`.

## Color tokens (exact, from user's md)

```css
--void: #07080d;          /* page background */
--surface-line: #161a29;  /* faint grid lines */
--parchment: #e8e2d3;     /* star-chart cream, used sparingly */
--ink: #1a1d2b;           /* text on parchment */
--ember: #e0455f;         /* signature red: active/instrument light only */
--ember-dim: rgba(224,69,95,0.35);
--brass: #a8895a;         /* secondary accent: coordinate labels, eyebrows */
--text-primary: #eceef4;
--text-body: #828aa3;
--text-muted: #6a7088;
--text-faint: #3d4258;
```

Ember appears on: the CURRENT nav entry, the current sighting (OlympIQ row), stat-block left borders, the CTA panel, hover accents, the two glows. Nowhere else.

## Typography

- Display/headings and name: Fraunces (next/font/google), serif. Headings and name only.
- Everything structural (nav, labels, coordinates, body-adjacent metadata, descriptions in project rows): JetBrains Mono (next/font/google).
- Body copy on dark: default to mono per the instrument feel, `--text-body`.

## Layout

- Fixed left sidebar (~180px), a logbook margin. Desktop only; below `md` it collapses to a slim top strip (name + RESUME link) with sections stacking full-width.
- Sidebar contents top to bottom: name (serif), "OBSERVATION LOG" eyebrow (mono, brass, uppercase), five nav entries, footer text pinned to bottom ("University of Waterloo / Computer Science").
- Nav entry = two-line stack: "ENTRY 0X" (mono, tiny, uppercase, `--text-faint`) over the section name (mono, `--text-body`). Active entry: "ENTRY 0X — CURRENT" in `--ember` (an en-dash-free rendering: use "ENTRY 0X / CURRENT") and name in `--text-primary` bold. Active state driven by scroll position (IntersectionObserver scroll-spy). Hover previews the active styling.
  - NOTE: the md spec writes "ENTRY 0X — CURRENT" with an em dash; site copy rules forbid em dashes, so render as "ENTRY 0X / CURRENT".
- Sidebar right edge: `1px solid #221f26` rule with `box-shadow: 1px 0 0 rgba(224,69,95,0.15)`.
- Main content: single column, 48-56px padding, no card grids anywhere.
- Faint coordinate grid (1px `--surface-line` lines every ~60px) as a background layer in the main content area only, never behind the sidebar. On load the grid draws in (opacity/scale line animation, ~1s, once). Disabled under `prefers-reduced-motion`.

## Sky

- Starfield canvas, denser and more visible than v1: ~2x star count (target `(w*h)/4500`, cap 450), radius range 0.3 to 2.2px so some stars are clearly larger, base alpha up to ~0.75. Occasional twinkle: most stars drift slowly in alpha; a small random subset (~8%) periodically brightens sharply for a moment. Static render under reduced motion.
- Per-section constellation, one each, faint (near background-star opacity, parchment-colored stars, `--surface-line`-ish strokes slightly brightened), unlabeled, positioned in the section's background:
  - About: Sagittarius (teapot), slightly more visible than the others
  - Projects: Ursa Major (big dipper)
  - Experience: Cygnus (northern cross)
  - Tech: Orion (belt + shoulders/feet)
  - Contact: Gemini (twin stick figures)
- One `Constellation` component driven by a data map of star coordinates and edges per constellation name.
- Red glows: (a) stationary very faint ember radial bloom behind Sagittarius in the hero corner; (b) a faint ember radial glow that follows the cursor over the main content (client component, `pointermove`, disabled under reduced motion and on touch devices).

## Sections

1. **About** (`id="about"`): serif name, identity line "Computer Science student at the University of Waterloo.", tagline "I enjoy building software that makes people's lives a little easier.", supporting line about currently building OlympIQ. Three stat blocks: left border `2px solid --ember`, brass mono uppercase eyebrow, serif value ("500+ problems solved" / "OlympIQ founder" / "4 hackathons"). CTA: dark glass panel, `background: rgba(224,69,95,0.1)`, `border: 1px solid --ember`, `box-shadow: 0 0 14px rgba(224,69,95,0.25)`, text `#f2a3ae` mono, label "View Resume". Secondary plain mono link to GitHub.
2. **Projects** (`id="projects"`): plain "Projects" heading (serif). Rows, not cards: top border `1px solid rgba(255,255,255,0.08)`; left side title (serif) + description (mono, muted) + tech list (mono, tiny); right side a stable fake RA/DEC coordinate (mono). OlympIQ row is current: `border-left: 2px solid --ember`, faint red gradient wash, coordinates in `--ember`; links to olympiq.ca and source. Other rows: `--ember-dim` left border, coordinates in `--brass`, GitHub link. Hover: row's red accent brightens, coordinate lights up. Fixed coordinates (stable, decorative): OlympIQ "RA 19h 04m / DEC -25 18", Flowboard "RA 05h 32m / DEC +22 01", TeacherAId "RA 12h 51m / DEC +56 22", FrostByte "RA 20h 41m / DEC +45 17", CourtManager "RA 07h 34m / DEC +31 53".
3. **Experience** (`id="experience"`): two subsections under one plain "Experience" heading. (a) Results list: CCC Senior Distinction 2024/2025/2026, USACO Silver Division 2024, CALICO Bronze 2024, DMOJ Top 2% 300+ points, Codeforces Rating 1200+, St. Lawrence 1st place team 2024. (b) The Kurius and Science Olympics entries with existing bullets, dated mono labels.
4. **Tech** (`id="tech"`): plain "Tech" heading. Grid of inline SVG brand logos, each rendered dimmed (grayscale/low opacity) and blooming to full brand color on hover (CSS transition, no JS). Set: C++ (#00599C), Java (#EA2D2E), Python (#3776AB), TypeScript (#3178C6), JavaScript (#F7DF1E), React (#61DAFB), Next.js (#e8e2d3 on dark), Node.js (#5FA04E), Tailwind CSS (#38BDF8), Firebase (#FFCA28), Cloudflare (#F38020), Spring Boot (#6DB33F), Git (#F05032). Mono name label under each icon. Icons as local inline SVG paths (simple-icons path data), no new npm dependency, no network fetch.
5. **Contact** (`id="contact"`): Summer 2027 co-op line, email (mailto), GitHub, resume links in mono. Minimal footer line.

## Corners

Zero border radius everywhere: CTA panel, stat blocks, tech tiles, focus outlines, all of it square with hairline 1px borders, like etched instrument plates. The only round things on the page are stars, constellation nodes, and the radial falloff of the two ember glows.

## Hover language (instrument-style, everywhere but quiet)

Every interactive element reacts; nothing scales, bounces, or translates. Color/glow transitions only (~200ms ease): nav entries preview CURRENT, project rows brighten ember accent + coordinates, stat blocks warm their border, CTA glow deepens, tech logos gain brand color, links shift to ember. Cursor glow provides the ambient "red flashlight" feel.

## What to avoid (from user's md, still binding)

Card grids; top navbar on desktop; overusing red; glowing orbs/large gradient blobs (the two sanctioned glows are faint and small); numbered 01/02/03 section markers (coordinates and ENTRY labels instead); explaining the metaphor in copy; theming nouns.

## Tech approach

- Same repo/branch, Next.js static. Replace section components and theme in place; `lib/content.ts` stays the single content source (updated per amendments), plus new `lib/constellations.ts` (star/edge data per constellation) and `lib/techstack.ts` (name, brand color, SVG path).
- Client components: `Starfield` (rewritten), `Sidebar` (scroll-spy), `CursorGlow`. Everything else server components.
- Fonts switch to Fraunces + JetBrains Mono in `layout.tsx`. OG image restyled to match (void background, serif name, ember accent, brass eyebrow).
- Old components removed: Nav, old section styling, Reveal usage may stay for section fade-ins only if it doesn't fight the grid draw-in; otherwise drop Reveal.
- No new npm dependencies.

## Verification

Lint + build clean; preview checks at desktop and mobile: sidebar scroll-spy CURRENT tracking, all five constellations visible but subtle, starfield clearly visible with twinkles, hover states on nav/rows/CTA/icons, /resume.pdf 200, no console errors, no horizontal overflow, reduced-motion disables grid draw-in, twinkle, and cursor glow. Copy audit: no em dashes, no LinkedIn, no "incoming", no "class of 2031", no "max rating", no Missions/Trajectory/Sightings.
