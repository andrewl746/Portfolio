import { formatDownloads, nebulosityDownloads } from "@/lib/downloads";

// Nebulosity's live download total for the badge in the GitHub profile README,
// in the format shields.io's endpoint badge reads
// (https://shields.io/badges/endpoint-badge). Rebuilt at most once a day,
// like the home page, from the same count (lib/downloads.ts).
export const revalidate = 86400;

export async function GET() {
  const total = await nebulosityDownloads();
  return Response.json({
    schemaVersion: 1,
    label: "downloads",
    message: formatDownloads(total),
    // The site's ember red.
    color: "e0455f",
    // How long shields.io keeps its copy before asking again.
    cacheSeconds: 86400,
  });
}
