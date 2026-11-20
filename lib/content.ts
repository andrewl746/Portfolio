export type Project = {
  name: string;
  context: string;
  description: string;
  tech: string[];
  github?: string;
  live?: string;
  // Demo video, for example on YouTube.
  video?: string;
  // Hackathon write-up.
  devpost?: string;
  // A headline number shown in the subheading after the context, brighter
  // than the rest of it, such as a download count.
  stat?: string;
  award?: string;
  // Card screenshot in public/projects/, made with scripts/process-project-image.mjs.
  image?: { src: string; alt: string };
  // Turns a phrase in the description into a link, such as a claim into the
  // evidence behind it. `text` must appear in the description exactly once
  // (the build fails otherwise); `hint` tells screen readers where it goes.
  descriptionLink?: { text: string; href: string; hint: string };
};

export const SITE = {
  name: "Andrew Li",
  // Where the site is served. andrewli.app (no www) redirects here, so the
  // sitemap, canonical URL and link previews all use this address.
  url: "https://www.andrewli.app",
  identity: "Computer Science student at the University of Waterloo",
  // The same on a phone, where the full line wraps onto two rows.
  identityShort: "CS @ University of Waterloo",
  tagline: "Software engineer, aiming for space.",
  // One sentence per line on wider screens.
  sub: [
    "Shipped Nebulosity, which makes Claude Code up to 4.4× faster.",
    "Currently building software that helps satellites avoid collisions.",
  ],
  email: "andrewli746@gmail.com",
  linkedIn: "https://www.linkedin.com/in/andrewl746/",
  x: "https://x.com/andrewl746",
  github: "https://github.com/andrewl746",
  resumeHref: "/Andrew_Li_Resume.pdf",
};

export const STATS = [
  { eyebrow: "Working at", value: "Instant Scaling" },
  { eyebrow: "Award winner at", value: "Hack the North" },
];

export const FLAGSHIP: Project = {
  name: "Nebulosity",
  context: "Live at nebulosity.ca",
  description: "Gives Claude Code a live map of how a large codebase fits together, so it can answer a question that spans many files with one tool call instead of a chain of searches. On multi-file questions, Claude Code with Nebulosity answered up to 4.4× faster and was fully right in 42 of 42 test runs, versus 29 without it. Nebulosity is published on npm, the VS Code Marketplace, and Open VSX, and you can explore its interactive map in VS Code or the browser.",
  // {downloads} is filled in with the live total from those three stores
  // (lib/downloads.ts).
  stat: "{downloads} downloads",
  // The speedup links to how it was measured, for anyone who doubts it.
  descriptionLink: {
    text: "4.4× faster",
    href: "https://nebulosity.ca/#evaluation",
    hint: "how it was measured",
  },
  tech: ["TypeScript", "MCP", "SQLite", "Next.js"],
  live: "https://nebulosity.ca",
  video: "https://youtu.be/p6-T-qkoOXo",
  github: "https://github.com/andrewl746/Nebulosity",
  image: {
    src: "/projects/nebulosity-map-v5.webp",
    alt: "Nebulosity's map of VS Code's editor folder, with editor.main.ts selected, the files it imports highlighted, and its AI-written summary beside it",
  },
};

export const PROJECTS: Project[] = [
  {
    name: "Pyronac",
    context: "NASA Space Apps 2026",
    description:
      "Merges NASA's MODIS and VIIRS satellite fire data into one consistent record for Canada, India, and Brazil from 2003 to now. VIIRS reports about 5 times more hotspots than MODIS, so the raw fire counts jumped when VIIRS came online in 2012 even though nothing had changed on the ground. I built a harmonization model to remove that discrepancy, and it cut the gap between the two satellites' monthly fire counts from 78.5% to 9.2% on years it was never trained on. I also led the technical design and built a tool that picks optimal locations for firefighting bases. On a decade of data it had never seen, its sites covered 3 times more hotspots than bases placed where fires had burned before.",
    // The error figure links to the method write-up, for anyone who doubts it.
    descriptionLink: {
      text: "from 78.5% to 9.2%",
      href: "https://github.com/andrewl746/pyronac/blob/main/docs/METHOD.md",
      hint: "how it was measured",
    },
    tech: ["Python", "scikit-learn", "DuckDB", "FastAPI", "React"],
    live: "https://pyronac.andrewli.app",
    github: "https://github.com/andrewl746/pyronac",
    image: {
      src: "/projects/pyronac-bases.webp",
      alt: "Pyronac's fire base planner on the night globe, with 25 numbered base sites across Canada over the July 2023 fire hotspots",
    },
  },
  {
    name: "Suplex",
    context: "Hack the Valley 2026",
    description:
      "Checks any Toronto address against the City's 4 pre-approved multiplex designs and shows the result in 3D. I led the technical design and built the rules engine, which screened all 495,456 lots in Toronto against the zoning by-law and answers a single address in under 50 ms. I also built the FastAPI backend and the three.js 3D scene.",
    tech: ["Python", "FastAPI", "Shapely", "three.js", "React"],
    live: "https://suplex.andrewli.app",
    github: "https://github.com/andrewl746/suplex",
    devpost: "https://devpost.com/software/suplex",
    image: {
      src: "/projects/suplex.webp",
      alt: "Suplex showing a fourplex design in 3D on a Toronto lot, next to which of the four designs fit",
    },
  },
  {
    name: "OlympIQ",
    context: "Live at olympiq.ca",
    description:
      "Set to run scheduling for my high school's Science Olympics team, where executives used to spend 10+ hours manually assigning 60+ competitors to events while juggling their preferences and avoiding time conflicts. A custom algorithm now does it instantly, flags any conflicts it can't resolve, and exports the schedule to Excel. It was piloted with the executives in summer 2026 before the full rollout for the 2027 season.",
    tech: ["Next.js", "TypeScript", "Firebase", "Firestore"],
    live: "https://www.olympiq.ca",
    image: {
      src: "/projects/olympiq-schedule-v10.webp",
      alt: "OlympIQ's schedule page, showing each competitor's assigned events and flagged time conflicts that need review",
    },
  },
];

export type Award = {
  event: string;
  result: string;
  year: string;
  link?: string;
};

export const AWARDS: Award[] = [
  {
    event: "Hack the North",
    result: "Best Mobile Experience (Expo)",
    year: "2026",
    link: "https://devpost.com/software/fresco-b1riws",
  },
  {
    event: "Hack Canada",
    result: "Best Use of Gemini AI",
    year: "2025",
    link: "https://dorahacks.io/build/23086/milestones",
  },
  { event: "CCC Senior", result: "Distinction", year: "2026, 2025, 2024" },
  { event: "DMOJ", result: "Top 2%, 300+ Points", year: "Ongoing" },
  { event: "CALICO (UC Berkeley)", result: "Bronze Brick Winner", year: "2024" },
  { event: "St. Lawrence Coding Competition", result: "1st Place Team", year: "2024" },
];

export type ExperienceEntry = {
  org: string;
  role: string;
  period: string;
  blurb?: string;
  bullets?: string[];
  link?: string;
};

export const EXPERIENCE: ExperienceEntry[] = [
  {
    org: "Instant Scaling",
    role: "Artificial Intelligence Engineer",
    period: "Nov 2026 to Present",
    blurb:
      "Performance marketing agency that runs Meta ad campaigns for direct-to-consumer brands.",
    link: "https://instantscaling.com/",
    bullets: [
      "Architecting a company-wide AI platform where specialized agents handle business work 24/7.",
      "Building agents that switch AI providers during outages, remember past work, and learn from human corrections.",
    ],
  },
  {
    org: "Marble Investments",
    role: "Software Engineer",
    period: "Sep 2026 to Nov 2026",
    blurb:
      "Equity research firm backed by private capital, investing in the trends reshaping the world.",
    link: "https://www.marbleinvestments.ca/",
    bullets: [
      "Built a news pipeline for the firm's stock research platform that pulls news and SEC filings for 194 stocks every 10 minutes and merges them into one feed.",
      "Filtered out noise like ads and opinion pieces, reaching 93% precision on 74 hand-checked articles.",
      "Added an LLM classifier (Claude, structured outputs) that raised the precision to 97%, then cut its API cost in half with prompt caching.",
      "Prototyped another classifier that sorts industry news into 23 investment themes, with 88% of 89 articles on topic.",
    ],
  },
  {
    org: "UW Orbital",
    role: "Software Engineer, Ground Station",
    period: "Sep 2026 to Present",
    blurb:
      "The University of Waterloo's satellite design team, building a 3U CubeSat to be the first satellite launched by Waterloo students. Now competing for the Canadian Space Agency's CUBICS program.",
    bullets: [
      "Developing the Mission Control Centre, the ground station web app operators use to send commands to the CubeSat and monitor the telemetry it sends back.",
      "Designing and building the operator dashboard, combining satellite status, command history, telemetry, and the satellite's latest image into one unified interface.",
    ],
    link: "https://www.uworbital.org/",
  },
  {
    org: "Science Olympics Team",
    role: "Head Trainer",
    period: "Feb 2023 to Jun 2026",
    blurb:
      "Victoria Park Collegiate Institute, Toronto. A 60+ member team that competes in science events at Western University and the University of Guelph.",
    bullets: [
      "Led a team of 6 trainers. All 4 junior teams I coached placed 1st at Western University's Science Olympics.",
      "Created the first structured training program and recruited experienced competitors as trainers.",
      "Then developed OlympIQ, which is set to run scheduling and signups for the team.",
    ],
    link: "https://vpciscienceolympics.wixsite.com/vpci-science-olympic",
  },
  {
    org: "Kurius",
    role: "C++ Instructor",
    period: "Jul 2024 to Aug 2024",
    blurb:
      "Nonprofit coding organization providing free courses and tools to over 2,200 members worldwide.",
    bullets: [
      "Designed and taught a 5-week introductory C++ course to 11 university students covering syntax, data types, pointers, and functions.",
      "Guided every student to build a working library management system with arrays and custom functions as their final project.",
    ],
    link: "https://www.kurius.ca/",
  },
];
