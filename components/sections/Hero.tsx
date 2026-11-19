import { SITE, STATS } from "@/lib/content";
import AnimatedStatValue from "@/components/animations/AnimatedStatValue";
import HyperdriveTagline from "@/components/animations/HyperdriveTagline";

// The hero text fades in as the name rises (lib/earth/coast.ts). The stat
// values wait this long before they come in, so they do it where they can be
// seen, and the tagline arrives after them.
const STATS_DELAY_MS = 400;

/**
 * The first screen: the name as wide as the screen allows, standing behind
 * the Earth's limb. Above it, in clear sky, the school line and the two
 * credits. Under the limb at the left, on dark ocean, the two sentences and
 * the buttons, so nothing sits on the city lights.
 *
 * The scene places all of it (data-scene, lib/earth/coast.ts): it works out
 * the horizon's height and the name's size from how much room this text
 * needs. The section is two screens tall and the text is pinned for the
 * first of them, while the name sets behind the Earth.
 *
 * The tagline is here twice and CSS shows one: above the name on wide
 * screens, with the two sentences under the limb on narrower ones, where the
 * top would get crowded.
 */
export default function Hero() {
  return (
    <section id="about" data-scene="pin" className="hero-pin">
      <h1 data-scene="name" className="hero-name">
        {SITE.name}
      </h1>
      <div data-scene="hero" className="hero">
        <div data-scene="hero-top" className="hero-top hero-text">
          <div className="hero-who">
            <p className="hero-eyebrow">{SITE.identity}</p>
            <p className="hero-tagline">
              <HyperdriveTagline text={SITE.tagline} />
            </p>
          </div>
          <dl className="hero-stats">
            {STATS.map((s) => (
              <div key={s.eyebrow} className="hero-stat">
                <dt>{s.eyebrow}</dt>
                {/* An invisible ::before copy of the final value reserves the
                    width, so the letters coming in never shift their
                    neighbours. It's a pseudo-element so the value isn't
                    duplicated in the page text that crawlers and screen
                    readers see. */}
                <dd data-value={s.value}>
                  {/* Clipped: scrambled letters (m, w...) can be wider than
                      the final word. */}
                  <span>
                    <AnimatedStatValue value={s.value} delay={STATS_DELAY_MS} />
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div data-scene="hero-band" className="hero-band hero-text">
          <p className="hero-tagline">
            <HyperdriveTagline text={SITE.tagline} />
          </p>
          <p className="hero-sub">
            {SITE.sub.map((s) => (
              <span key={s}>{s} </span>
            ))}
          </p>
          <div className="hero-actions">
            <a
              href={SITE.resumeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-ember bg-ember/10 px-6 py-3 text-sm text-[#f2a3ae] shadow-[0_0_14px_rgba(224,69,95,0.25)] transition-shadow hover:shadow-[0_0_22px_rgba(224,69,95,0.4)]"
            >
              View Resume
            </a>
            {/* The text links wrap as one group, so a narrow phone never
                strands a lone "X" on its own line under the button. */}
            <div className="hero-links">
              <a
                href={SITE.github}
                target="_blank"
                rel="noopener noreferrer"
                className="tap text-sm text-body underline decoration-line underline-offset-4 transition-colors hover:text-ember"
              >
                GitHub
              </a>
              <a
                href={SITE.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="tap text-sm text-body underline decoration-line underline-offset-4 transition-colors hover:text-ember"
              >
                LinkedIn
              </a>
              <a
                href={SITE.x}
                aria-label="X (formerly Twitter)"
                target="_blank"
                rel="noopener noreferrer"
                className="tap text-sm text-body underline decoration-line underline-offset-4 transition-colors hover:text-ember"
              >
                X
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
