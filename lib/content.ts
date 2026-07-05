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
  tagline: "I enjoy building software that makes people's lives easier.",
  sub: "Currently building OlympIQ, the platform my high school's Science Olympics team runs on.",
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
  coord: "CAT. Nº 001",
  live: "https://www.olympiq.ca",
};

export const PROJECTS: Project[] = [
  {
    name: "Flowboard",
    context: "JamHacks 2026",
    description:
      "Turns a GitHub repository into an interactive flowchart. Folders, files, and functions become nodes on a canvas, and an assistant grounded in the actual file tree and code excerpts answers questions about where to start reading.",
    tech: ["Next.js", "React Flow", "Zustand", "Anthropic API"],
    coord: "CAT. Nº 002",
    github: "https://github.com/andrewl746/Flowboard",
  },
  {
    name: "TeacherAId",
    context: "GenAI Genesis 2026",
    description:
      "Reads student reasoning, not just their answers. Classifies misconceptions from written explanations, builds per-student profiles and class-wide analytics, and tells teachers what to reteach next.",
    tech: ["Firebase", "Claude API", "Cloudflare Workers"],
    coord: "CAT. Nº 003",
    github: "https://github.com/andrewl746/TeacherAId",
  },
  {
    name: "FrostByte",
    context: "Hack Canada 2025",
    description:
      "Estimates frostbite and hypothermia risk from live weather and what you're wearing, then tells you how long you can safely stay outside.",
    tech: ["Next.js", "Node.js", "Firebase", "Gemini API"],
    coord: "CAT. Nº 004",
    github: "https://github.com/andrewl746/FrostByte",
    award: "Best Use of Gemini AI",
  },
  {
    name: "CourtManager",
    context: "IB HL CS Internal Assessment",
    description:
      "Team management for my high school's tennis doubles squad, with a custom merge-sort based pairing algorithm, player records, and lineup planning.",
    tech: ["Java", "Spring Boot", "JavaScript"],
    coord: "CAT. Nº 005",
    github: "https://github.com/andrewl746/CourtManager",
  },
];

export const RESULTS = [
  { event: "CCC Senior", result: "Distinction", year: "2024, 2025, 2026" },
  { event: "DMOJ", result: "Top 2%, 300+ Points", year: "Ongoing" },
  { event: "USACO", result: "Silver Division", year: "2024" },
  { event: "Codeforces", result: "Rating 1200+", year: "Ongoing" },
  { event: "CALICO", result: "Bronze", year: "2024" },
  { event: "St. Lawrence Coding Competition", result: "1st Place Team", year: "2024" },
];

export type ExperienceEntry = {
  org: string;
  role: string;
  period: string;
  blurb?: string;
  bullets: string[];
};

export const EXPERIENCE: ExperienceEntry[] = [
  {
    org: "Kurius",
    role: "C++ Instructor, Outreach and Partnership Coordinator",
    period: "Dec 2023 to present",
    blurb:
      "Nonprofit coding organization offering free courses and tools to 2,200+ members worldwide.",
    bullets: [
      "Taught a 5-week Introduction to C++ course to a class of 14 university students. By the end, students who had never written C++ were shipping functional programs.",
      "Contacted 200+ companies for sponsorships and partnerships supporting free technology education.",
    ],
  },
  {
    org: "Science Olympics Team, Victoria Park CI",
    role: "Head Trainer",
    period: "Sep 2023 to Jun 2026",
    bullets: [
      "Led a team of 6 trainers. All 4 junior teams I coached placed 1st at Western University's Science Olympics.",
      "Designed the team's first structured training program, recruiting experienced competitors as trainers.",
      "Then built OlympIQ, which now runs scheduling and signups for the team's 60+ competitors.",
    ],
  },
];
