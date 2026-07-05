const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, LevelFormat,
  TabStopType, TabStopPosition, BorderStyle, ExternalHyperlink,
} = require("docx");

const OUT = process.argv[2];

const FONT = "Calibri";
const SZ = 21;        // 10.5pt body
const SZ_NAME = 44;   // 22pt name
const SZ_HEAD = 22;   // 11pt section headings

const sectionHeading = (text) =>
  new Paragraph({
    spacing: { before: 70, after: 30 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "444444", space: 2 } },
    children: [new TextRun({ text, bold: true, size: SZ_HEAD, font: FONT, allCaps: true })],
  });

const entryLine = (left, right, opts = {}) =>
  new Paragraph({
    spacing: { before: opts.first ? 20 : 60, after: 15 },
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children: [
      new TextRun({ text: left, bold: true, size: SZ, font: FONT }),
      ...(opts.leftItalic ? [new TextRun({ text: opts.leftItalic, italics: true, size: SZ, font: FONT })] : []),
      new TextRun({ text: "\t" + right, size: SZ, font: FONT }),
    ],
  });

const subLine = (text) =>
  new Paragraph({
    spacing: { after: 20 },
    children: [new TextRun({ text, italics: true, size: SZ, font: FONT })],
  });

const bullet = (text) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 20 },
    children: [new TextRun({ text, size: SZ, font: FONT })],
  });

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: SZ } } } },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 340, hanging: 170 } } },
        }],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: [
        // Header
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: "Andrew Li", bold: true, size: SZ_NAME, font: FONT })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "PHONE_REMOVED | andrewli746@gmail.com | ", size: SZ, font: FONT }),
            new ExternalHyperlink({
              children: [new TextRun({ text: "github.com/andrewl746", style: "Hyperlink", size: SZ, font: FONT })],
              link: "https://github.com/andrewl746",
            }),
            new TextRun({ text: " | ", size: SZ, font: FONT }),
            new ExternalHyperlink({
              children: [new TextRun({ text: "andrewli.app", style: "Hyperlink", size: SZ, font: FONT })],
              link: "https://andrewli.app",
            }),
          ],
        }),

        // EDUCATION
        sectionHeading("Education"),
        entryLine("University of Waterloo", "Waterloo, ON", { first: true }),
        subLine("Candidate for Bachelor of Computer Science (Honours, Co-op), Sep 2026 to Apr 2031. Seeking Summer 2027 internship (first work term)."),
        entryLine("Victoria Park Collegiate Institute", "Toronto, ON"),
        subLine("IB Diploma, Sep 2022 to Jun 2026."),

        // PROJECTS
        sectionHeading("Projects"),
        entryLine("OlympIQ", "Sep 2025 to present", { first: true, leftItalic: " | Next.js, TypeScript, Firebase, Firestore | olympiq.ca" }),
        bullet("Built and launched a Science Olympics team-management platform used by 60+ competitors, with role-based access for teachers, executives, and competitors."),
        bullet("Implemented event scheduling with automatic conflict detection and Excel export, and preference-based automatic competitor-to-event assignment."),
        bullet("Shipped solo from design to production across 100+ commits, including Firestore security rules and role-based onboarding with team codes."),

        entryLine("Flowboard", "JamHacks 2026", { leftItalic: " | Next.js, React 19, TypeScript, React Flow, Zustand, Anthropic API" }),
        bullet("Built a codebase onboarding tool that scans a GitHub repository and renders folders, files, and functions as an interactive dependency graph."),
        bullet("Grounded an AI assistant in repository context (file hierarchy, visible graph nodes, and code excerpts) so answers reference the actual codebase rather than generic advice."),

        entryLine("TeacherAId", "GenAI Genesis 2026", { leftItalic: " | Firebase, Firestore, Claude API, Cloudflare Workers" }),
        bullet("Built a classroom analytics platform that classifies misconceptions from students' written reasoning and aggregates them into class-wide dashboards with reteach suggestions."),
        bullet("Proxied Claude API calls through a Cloudflare Worker to keep credentials server-side, with rate limiting and Firebase App Check."),
        bullet("Added adaptive question generation that targets the class's weakest concepts automatically."),

        entryLine("FrostByte", "Hack Canada 2025", { leftItalic: " | Next.js, Node.js, Firebase, Gemini API" }),
        bullet("Won Best Use of Gemini AI or Gemini API for a web app that estimates frostbite and hypothermia risk from live weather and clothing input, with safe-exposure time limits."),

        // EXPERIENCE
        sectionHeading("Experience"),
        entryLine("Kurius (nonprofit)", "Dec 2023 to present", { first: true, leftItalic: " | C++ Instructor and Outreach Coordinator, Remote" }),
        bullet("Taught a 5-week Introduction to C++ course to 14 university students; by the end, beginners were confidently shipping functional C++ programs."),
        bullet("Reached out to 200+ companies to secure sponsorships and partnerships for the 2,200+-member organization."),

        entryLine("Science Olympics Team, Victoria Park CI", "Sep 2023 to Jun 2026", { leftItalic: " | Head Trainer" }),
        bullet("Led a team of 6 trainers; all 4 junior teams coached placed 1st at Western University's Science Olympics."),
        bullet("Created the team's first structured training program and recruited experienced competitors as trainers."),
        bullet("Then developed OlympIQ, which now runs scheduling and signups for the team."),

        // AWARDS
        sectionHeading("Awards"),
        bullet("Canadian Computing Competition (Senior): Distinction, 2024, 2025, 2026"),
        bullet("DMOJ top 2% (300+ points); Codeforces rating 1200+; USACO Silver Division; 500+ problems solved"),
        bullet("CALICO Bronze, 2024"),
        bullet("Best Use of Gemini AI or Gemini API, Hack Canada 2025"),
        bullet("1st place team, St. Lawrence Coding Competition 2024"),

        // SKILLS
        sectionHeading("Skills"),
        new Paragraph({
          spacing: { before: 40, after: 20 },
          children: [
            new TextRun({ text: "Languages: ", bold: true, size: SZ, font: FONT }),
            new TextRun({ text: "C++, Java, Python, TypeScript, JavaScript, HTML/CSS", size: SZ, font: FONT }),
          ],
        }),
        new Paragraph({
          spacing: { after: 0 },
          children: [
            new TextRun({ text: "Frameworks and tools: ", bold: true, size: SZ, font: FONT }),
            new TextRun({ text: "React, Next.js, Node.js, Tailwind CSS, Firebase, Cloudflare Workers, Spring Boot, Git/GitHub", size: SZ, font: FONT }),
          ],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buffer);
  console.log("Wrote", OUT);
});
