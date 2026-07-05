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
