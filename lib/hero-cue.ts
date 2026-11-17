// The hero's stat values (AnimatedStatValue) come in letter by letter as the
// page opens, and the tagline (HyperdriveTagline) arrives once they finish,
// so the eye goes from one to the other.
let settled = false;
const waiting = new Set<() => void>();

/** Called by a stat value when it has finished coming in. */
export function statsSettled() {
  if (settled) return;
  settled = true;
  for (const f of waiting) f();
  waiting.clear();
}

/** Runs f once the stats have settled (at once if they already have).
 *  Returns a function that cancels the wait. */
export function onStatsSettled(f: () => void): () => void {
  if (settled) {
    f();
    return () => {};
  }
  waiting.add(f);
  return () => {
    waiting.delete(f);
  };
}
