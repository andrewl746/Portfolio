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
  award?: string;
  // Card screenshot in public/, made per docs/project-images.md.
  image?: { src: string; alt: string };
};

export const SITE = {
  name: "Andrew Li",
  identity: "Computer Science student at the University of Waterloo",
  tagline: "Software engineer, aiming for space.",
  sub: "Recently shipped Nebulosity, a live map of large codebases that makes Claude Code up to 4.4× faster on questions that span many files.",
  email: "andrewli746@gmail.com",
  linkedIn: "https://www.linkedin.com/in/andrewl746/",
  x: "https://x.com/andrewl746",
  github: "https://github.com/andrewl746",
  resumeHref: "/Andrew_Li_Resume.pdf",
};

export const STATS = [
  { eyebrow: "Currently working at", value: "Marble Investments" },
  { eyebrow: "Award winner at", value: "Hack the North" },
];

export const FLAGSHIP: Project = {
  name: "Nebulosity",
  context: "Live at nebulosity.ca",
  description: "Gives Claude Code a live map of how a big codebase fits together, so a question that spans many files takes one tool call instead of a chain of searches. In 378 test runs, Claude Code answered those up to 4.4× faster and got all 42 fully right, against 29 without it. Published on npm and the VS Code Marketplace, with an interactive map you can explore in VS Code or the browser.",
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
    name: "OlympIQ",
    context: "Live at olympiq.ca",
    description:
      "Set to run scheduling for my high school's Science Olympics team, where executives used to spend 10+ hours manually assigning 60+ competitors to events while juggling their preferences and avoiding time conflicts. A custom algorithm now does it instantly, flags any conflicts it can't resolve, and exports the schedule to Excel. It was piloted with the executives this summer before the full rollout for the 2026–27 season.",
    tech: ["Next.js", "TypeScript", "Firebase", "Firestore"],
    live: "https://www.olympiq.ca",
    image: {
      src: "/projects/olympiq-schedule-v10.webp",
      alt: "OlympIQ's schedule page, showing each competitor's assigned events and flagged time conflicts that need review",
    },
  },
  {
    name: "Suplex",
    context: "Hack the Valley 2026",
    description:
      "Checks any Toronto address against the City's four pre-approved multiplex designs and shows the result in 3D. I led the technical design and built the rules engine, which screened all 495,456 lots in Toronto against the zoning by-law and answers a single address in under 50 ms. I also built the FastAPI backend and the three.js 3D scene.",
    tech: ["Python", "FastAPI", "Shapely", "three.js", "React"],
    github: "https://github.com/andrewl746/suplex",
    devpost: "https://devpost.com/software/suplex",
    image: {
      src: "/projects/suplex.webp",
      alt: "Suplex showing a fourplex design in 3D on a Toronto lot, next to which of the four designs fit",
    },
  },
  {
    name: "CourtManager",
    context: "IB HL CS Internal Assessment",
    description:
      "Plans lineups for a 12-player high school tennis doubles team by pairing teammates with a custom merge-sort algorithm.",
    tech: ["Java", "Spring Boot", "JavaScript"],
    github: "https://github.com/andrewl746/CourtManager",
    image: {
      src: "/projects/courtmanager-lineups-v2.webp",
      alt: "CourtManager's lineups page, showing ranked doubles pairs with compatibility scores on a tennis court layout",
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
    org: "Marble Investments",
    role: "Software Engineer",
    period: "Sep 2026 to Present",
    blurb:
      "Equity research firm backed by private capital, investing in the trends reshaping the world.",
    link: "https://www.marbleinvestments.ca/",
    bullets: [
      "Building a news pipeline for the firm's stock research platform that sources and filters the latest news for every company the team tracks, then merges it into one feed.",
      "Integrating an LLM to flag industry news that could affect those companies."
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
      "Every student successfully built a fully functional Library Management System using arrays and custom functions for their final project."
    ],
    link: "https://www.kurius.ca/",
  },
];
