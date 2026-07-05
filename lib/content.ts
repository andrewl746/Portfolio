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
  tagline: "I enjoy building software to optimize workflows.",
  sub: "Currently exploring how AI agents work through tool use, RAG, and the ReAct loop.",
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
    "Streamlines the management of my high school's Science Olympics team. It handles event scheduling with automatic conflict detection, assigns competitors to events based on their preferences, tracks attendance, and exports data to Excel. Used by over 60 members on the team.",
  tech: ["Next.js", "TypeScript", "Firebase", "Firestore"],
  coord: "LOG-001",
  live: "https://www.olympiq.ca",
};

export const PROJECTS: Project[] = [
  {
    name: "Flowboard",
    context: "JamHacks 2026",
    description:
      "Turns a GitHub repository into an interactive flowchart. Folders, files, and functions are displayed as nodes on a canvas. An AI assistant, using the file structure and code snippets, answers questions about the codebase.",
    tech: ["Next.js", "React Flow", "Zustand", "Anthropic API"],
    coord: "LOG-002",
    github: "https://github.com/andrewl746/Flowboard",
  },
  {
    name: "TeacherAId",
    context: "GenAI Genesis 2026",
    description:
      "Analyzes student reasoning alongside their answers. It identifies misconceptions from written explanations, creates profiles for each student, provides class-wide analytics, and advises teachers on what to focus on next.",
    tech: ["Firebase", "Claude API", "Cloudflare Workers"],
    coord: "LOG-003",
    github: "https://github.com/andrewl746/TeacherAId",
  },
  {
    name: "FrostByte",
    context: "Hack Canada 2025",
    description:
      "Estimates your risk of frostbite and hypothermia based on live weather conditions and your clothing, then advises how much longer you can safely stay outside.",
    tech: ["Next.js", "Node.js", "Firebase", "Gemini API"],
    coord: "LOG-004",
    github: "https://github.com/andrewl746/FrostByte",
    award: "Best Use of Gemini AI Award",
  },
  {
    name: "CourtManager",
    context: "IB HL CS Internal Assessment",
    description:
      "Manages my high school's 12-player tennis doubles team with a custom merge-sort pairing algorithm, player records, and lineup planning.",
    tech: ["Java", "Spring Boot", "JavaScript"],
    coord: "LOG-005",
    github: "https://github.com/andrewl746/CourtManager",
  },
];

export const RESULTS = [
  { event: "CCC Senior", result: "Distinction", year: "2024, 2025, 2026" },
  { event: "DMOJ", result: "Top 2%, 300+ Points", year: "Ongoing" },
  { event: "Codeforces", result: "Rating 1200+", year: "Ongoing" },
  { event: "USACO", result: "Silver Division", year: "2024" },
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
      "Nonprofit coding organization providing free courses and tools to over 2,200 members worldwide.",
    bullets: [
      "Taught a 5-week Introduction to C++ course to 14 university students. By the end, beginners were confidently shipping functional C++ programs.",
      "Reached out to 200+ companies to secure sponsorships and partnerships supporting free technology education.",
    ],
  },
  {
    org: "Science Olympics Team, Victoria Park C.I.",
    role: "Head Trainer",
    period: "Sep 2023 to Jun 2026",
    bullets: [
      "Led a team of 6 trainers. All 4 junior teams I coached placed 1st at Western University's Science Olympics.",
      "Created the first structured training program and recruited experienced competitors as trainers.",
      "Then developed OlympIQ, which now runs scheduling and signups for the team.",
    ],
  },
];
