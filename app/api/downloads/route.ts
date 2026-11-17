import { formatDownloads, nebulosityDownloads } from "@/lib/downloads";

// Nebulosity's live download total for the badge in the GitHub profile README,
// in the format shields.io's endpoint badge reads
// (https://shields.io/badges/endpoint-badge). Rebuilt at most once a day,
// like the home page, from the same count (lib/downloads.ts).
export const revalidate = 86400;

// Nebulosity's purple: its site's button fill, the shade white text stays
// readable on (the logo itself is #A855F7).
const PURPLE = "9333ea";

// Nebulosity's node graph from its icon, in white, to sit on the badge like
// the logos on the README's tech stack badges.
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="140 160 320 360"><g stroke="#fff" stroke-width="26" stroke-linecap="round"><line x1="340" y1="340" x2="425" y2="193"/><line x1="340" y1="340" x2="425" y2="487"/><line x1="340" y1="340" x2="170" y2="340"/></g><g fill="#fff"><circle cx="425" cy="193" r="34"/><circle cx="425" cy="487" r="34"/><circle cx="170" cy="340" r="30"/><circle cx="340" cy="340" r="72"/></g></svg>`;

export async function GET() {
  const total = await nebulosityDownloads();
  return Response.json({
    schemaVersion: 1,
    // A single segment ("1.5K+ DOWNLOADS"), so it's bold all the way across
    // like the tech badges; shields.io draws a separate label thinner.
    label: "",
    message: `${formatDownloads(total)} Downloads`,
    color: PURPLE,
    logoSvg: LOGO,
    style: "for-the-badge",
    // How long shields.io keeps its copy before asking again.
    cacheSeconds: 86400,
  });
}
