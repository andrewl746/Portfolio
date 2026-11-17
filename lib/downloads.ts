// Nebulosity's downloads across the three places it's published, for its
// project card. Read on the server when the page is built and again at most
// once a day after that (revalidate in app/page.tsx), so visitors never wait
// on the stores. A store that's down or answers oddly falls back to its last
// known count, and since downloads only go up, no store is ever counted below
// that.

const DAY_SECONDS = 86400;
const DAY_MS = DAY_SECONDS * 1000;

const NPM_PACKAGE = "nebulosity";
const EXTENSION = { publisher: "andrewl746", name: "nebulosity-vscode" };
// Before the npm package was first published (27 Oct 2026).
const NPM_SINCE = "2026-10-01";

// Counted by hand on 17 Nov 2026.
const LAST_KNOWN = { npm: 827, openVsx: 596, marketplace: 120 };

async function getJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(5000),
    next: { revalidate: DAY_SECONDS },
  });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.json();
}

const count = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("not a count");
  return value;
};

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

// npm sums at most 18 months per request, so add it up a year at a time.
async function npmDownloads(): Promise<number> {
  const today = new Date();
  let total = 0;
  for (let from = new Date(NPM_SINCE); from <= today; ) {
    const to = new Date(Math.min(from.getTime() + 364 * DAY_MS, today.getTime()));
    const body = (await getJson(
      `https://api.npmjs.org/downloads/point/${isoDate(from)}:${isoDate(to)}/${NPM_PACKAGE}`,
    )) as { downloads?: unknown };
    total += count(body.downloads);
    from = new Date(to.getTime() + DAY_MS);
  }
  return total;
}

async function openVsxDownloads(): Promise<number> {
  const body = (await getJson(
    `https://open-vsx.org/api/${EXTENSION.publisher}/${EXTENSION.name}`,
  )) as { downloadCount?: unknown };
  return count(body.downloadCount);
}

// The VS Code Marketplace's public query API, the one its own tools use.
async function marketplaceDownloads(): Promise<number> {
  const body = (await getJson(
    "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json;api-version=3.0-preview.1",
      },
      body: JSON.stringify({
        filters: [{ criteria: [{ filterType: 7, value: `${EXTENSION.publisher}.${EXTENSION.name}` }] }],
        flags: 914,
      }),
    },
  )) as {
    results?: { extensions?: { statistics?: { statisticName: string; value: number }[] }[] }[];
  };
  const stats = body.results?.[0]?.extensions?.[0]?.statistics ?? [];
  const stat = stats.find((s) => s.statisticName === "install") ?? stats.find((s) => s.statisticName === "downloadCount");
  return count(stat?.value);
}

/** Total downloads across npm, the VS Code Marketplace, and Open VSX. */
export async function nebulosityDownloads(): Promise<number> {
  const [npm, openVsx, marketplace] = await Promise.allSettled([
    npmDownloads(),
    openVsxDownloads(),
    marketplaceDownloads(),
  ]);
  const atLeast = (r: PromiseSettledResult<number>, known: number) =>
    r.status === "fulfilled" ? Math.max(r.value, known) : known;
  return (
    atLeast(npm, LAST_KNOWN.npm) +
    atLeast(openVsx, LAST_KNOWN.openVsx) +
    atLeast(marketplace, LAST_KNOWN.marketplace)
  );
}

/**
 * Rounded down, so the card never claims more than the stores show:
 * 1,543 is "1.5k+", 2,060 is "2k+", 870 is "800+".
 */
export function formatDownloads(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 100) / 10}k+`;
  if (n >= 100) return `${Math.floor(n / 100) * 100}+`;
  return String(n);
}
