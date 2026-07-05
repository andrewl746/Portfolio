# Andrew Li Portfolio (andrewli.app) + Co-op Resume — Design Spec

Date: 2026-07-05
Status: Approved pending user review

## Goal

Two deliverables:

1. A single-page portfolio site at andrewli.app, built in this repo (Next.js 16, Tailwind 4), optimized for co-op recruiters.
2. A rewritten one-page resume as a Word document (.docx), targeted at Waterloo CS sequence-1 co-op recruiting (first work term Summer 2027).

## Subject facts (source of truth for content)

- Andrew Li, incoming University of Waterloo Honours CS, class of 2031 (starts Sep 2026). Victoria Park CI, IB Diploma.
- Contact: andrewli746@gmail.com, github.com/andrewl746, PHONE_REMOVED (resume only). No LinkedIn; do not reference one anywhere.
- Competitive programming: 500+ problems solved (DMOJ, Codeforces, USACO). CCC Senior distinction 2024, 2025, 2026. USACO Silver. Top 2% on DMOJ (300+ points). Codeforces max rating 1200+. 1st place team, 2024 St. Lawrence Coding Competition.
- Hackathons: 4 competed. Featured: Flowboard (JamHacks 2026), TeacherAId (GenAI Genesis 2026), FrostByte (Hack Canada 2025, won "Best Use of Gemini AI or Gemini API"). A 2025 GenAI Genesis project is intentionally omitted. Only FrostByte won a prize; do not claim multiple wins.
- Kurius (nonprofit, Dec 2023–present): C++ instructor (taught 5-week intro C++ course to university students; students went from no C++ to functional programs) and Outreach & Partnership Coordinator (sponsor outreach).
- Science Olympics (Western University competition), head trainer 3 years: managed 6 trainers, all 4 junior teams placed 1st, designed the club's training system (recruited experienced competitors as trainers), ran recruitment workshops.
- Narrative link to preserve: the Science Olympics training-chaos problem is what OlympIQ productizes.

## Projects (content per project)

1. **OlympIQ** — flagship. Live at www.olympiq.ca, github.com/andrewl746/OlympIQ. Next.js, TypeScript, Firebase/Firestore. Platform for Science Olympics club management: schedules with automatic conflict detection and Excel export, materials sharing, priority forms, preference-based automatic event assignment, attendance/strike tracking, junior/senior eligibility handling. Role-based onboarding (teacher / executive / competitor, team codes). In use by his school's program.
2. **Flowboard** — JamHacks 2026. Next.js 16 App Router, React 19, TypeScript, Tailwind, React Flow (@xyflow/react), Zustand, GitHub OAuth, Anthropic API. Turns a GitHub repo into an interactive visual flowchart (folders/files/functions as nodes with relationships) for onboarding into unfamiliar codebases; AI assistant answers repo questions using file hierarchy, visible graph nodes, and code excerpts as context.
3. **TeacherAId** — GenAI Genesis 2026. Firebase Auth + Firestore, LLM-based misconception classification (DeepSeek per Devpost; repo README mentions Claude via Cloudflare Worker proxy — verify wording with user before finalizing resume bullet), Moorcheh AI memory layer. Students answer diagnostic questions with written reasoning; system classifies misconceptions, builds per-student profiles and class-wide analytics, generates intervention/reteach suggestions and adaptive questions targeting weakest concepts.
4. **CourtManager** — IB HL CS Internal Assessment. Java Spring Boot backend, JS/HTML/CSS frontend. Tennis doubles team management with custom merge-sort-based pairing algorithm, player management, lineup organization.
5. **FrostByte** — Hack Canada 2025, Gemini award winner. Next.js/Node/Firebase. Assesses frostbite/hypothermia risk from location, live weather, and clothing input; safe-exposure duration calculator; safety chatbot.

Site shows OlympIQ as a large flagship card, then Flowboard / TeacherAId / FrostByte / CourtManager as a card grid, plus one "more on GitHub" link. Resume features OlympIQ, Flowboard, TeacherAId prominently; FrostByte keeps its award line; CourtManager is a resume candidate only if space allows.

## Website design

**Aesthetic: "quiet observatory."** Premium through restraint.

- Background: near-black warm (#08080c family). Sparse starfield (lightweight canvas, subtle parallax drift, respects prefers-reduced-motion). One constellation only: Sagittarius, thin-stroke inline SVG with soft-glow nodes and slow twinkle, anchored right side of hero. No other constellations.
- Accent: crimson (#e04654 family, from user's reference palette) used sparingly: accent dot, hover states, thin card borders, at most one highlighted word in the hero. Everything else off-white / warm gray.
- Type: sharp grotesque sans for headings (Space Grotesk or Geist), mono for small labels and tech tags. Section labels like `01 / projects` (no "mission log" gimmick).
- Copy rules: no em dashes, no generic AI-sounding filler, concrete and specific throughout.

**Structure (single page):**

1. Hero: name, tagline "I enjoy building software that makes people's lives a little easier." plus incoming Waterloo CS '31 line; stat chips (3x CCC Senior distinction, 500+ problems solved, 4 hackathons); View resume button. Sagittarius here.
2. Projects: as above.
3. Competition: scannable list/table of CP results.
4. Experience: Kurius, Science Olympics head trainer.
5. Contact: email, GitHub, resume. No LinkedIn.

Sticky minimal nav (about / projects / competition / contact anchors). Footer minimal.

**Tech:** static Next.js app in this repo, no heavy client libs, inline SVG + small canvas only. Scroll-reveal via CSS. Metadata/OG tags for andrewli.app, OG image, favicon. Resume PDF served from `/resume`. Target: fast Lighthouse, fully scannable in ~30 seconds. NOTE: this repo's Next.js version has breaking changes; consult `node_modules/next/dist/docs/` before writing code.

## Resume design (.docx)

- Single column, ATS-safe, one page. Sections: header (no LinkedIn), Education, Projects, Experience, Awards, Skills.
- Projects first-class: OlympIQ (live, in real use, concrete features), Flowboard, TeacherAId, FrostByte (award line).
- Experience: Kurius split into instruction and outreach bullets with outcomes; Science Olympics head trainer added (currently missing).
- New Awards section: CCC Senior distinctions '24/'25/'26, USACO Silver, DMOJ top 2%, Hack Canada award, St. Lawrence 1st.
- Every bullet: action verb + specific outcome. No fabricated metrics.
- Deliverable: .docx via the docx skill, plus exported PDF for the site's /resume route.

## Error handling / testing

- Site: builds clean (`next build`), lint passes, manual visual verification via preview at desktop and mobile widths, reduced-motion check, metadata check.
- Resume: docx opens correctly, one page, ATS-friendly (no tables/columns/images in content flow).

## Out of scope

- Blog, CMS, analytics, multi-page routes, other constellations, LinkedIn.
