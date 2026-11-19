import Starfield from "@/components/Starfield";
import ScrollProgress from "@/components/ScrollProgress";
import TopBar from "@/components/TopBar";
import EarthScene from "@/components/EarthScene";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import Experience from "@/components/sections/Experience";
import Awards from "@/components/sections/Awards";
import Tech from "@/components/sections/Tech";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";
import { EARTH_DESKTOP, EARTH_MOBILE } from "@/lib/earth-scene";

// The page is built ahead of time and rebuilt in the background at most once
// a day, so Nebulosity's download count (lib/downloads.ts) stays current
// without visitors ever waiting on the stores.
export const revalidate = 86400;

const km = (altitude: number) => altitude.toLocaleString("en-US");

// The whole page is one flight: the live Earth is drawn over
// everything, the name sets behind it, each section rises from behind it,
// and the camera ends on the Contact finale's view. EarthScene runs it and
// finds what it moves by the data-scene attributes below and in the section
// components. The layers, back to front (globals.css): stars, the name,
// satellites over the sky, the page's content, the Earth, satellites crossing
// its face, the first screen's text, the bar.
export default function Home() {
  return (
    <div className="coast">
      <Starfield variant="still" />
      <ScrollProgress />
      <TopBar />
      <EarthScene />
      <main>
        <Hero />
        <div data-scene="page" className="page">
          <Projects />
          <Experience />
          <Awards />
          <Tech />
        </div>
        {/* The last screen: Contact in the sky, the finale's Earth under it,
            the caption and footer on the Earth's dark near side. A screen
            tall, so jumping to Contact lands on the whole scene. */}
        <div data-scene="end" data-nav-section="contact" className="end">
          <Contact />
          <div aria-hidden="true" className="end-scrim" />
          <div className="end-foot">
            {/* Right-aligned, over the dark Atlantic rather than the lights. */}
            <p className="end-caption">
              <span className="only-tall">
                Eastern North America from {km(EARTH_MOBILE.altitude)} km. Lights: NASA Black Marble.
              </span>
              <span className="only-wide">
                Eastern North America at night from {km(EARTH_DESKTOP.altitude)} km. City lights: NASA Black Marble.
              </span>
            </p>
            <Footer />
          </div>
        </div>
      </main>
    </div>
  );
}
