// Month and year of the build, in Waterloo's time zone (build servers run on
// UTC, which would flip the month a few hours early).
const UPDATED = new Date().toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "America/Toronto",
});

// Rendered on the server and passed into the Earth finale, so the date is
// stamped at build time and refreshes on every deploy: it can't go stale or
// be forgotten.
export default function Footer() {
  return (
    <footer className="flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-line pt-4 text-[10px] uppercase tracking-[0.1em] text-faint">
      <span>© {new Date().getFullYear()} Andrew Li.</span>
      <span>Updated {UPDATED}</span>
    </footer>
  );
}
