import Starfield from "@/components/Starfield";
import CursorGlow from "@/components/CursorGlow";
import Sidebar from "@/components/Sidebar";
import About from "@/components/sections/About";
import Projects from "@/components/sections/Projects";
import Experience from "@/components/sections/Experience";
import Awards from "@/components/sections/Awards";
import Tech from "@/components/sections/Tech";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <div>
      <Starfield />
      <CursorGlow />
      <Sidebar />
      {/* overflow-x-clip: decorative glows near the right edge can't widen
          the page into a sideways scroll on phones. */}
      <main className="relative overflow-x-clip md:ml-[180px]">
        <div aria-hidden="true" className="coord-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-4xl px-6 pt-14 md:px-14 md:pt-0">
          <About />
          <Experience />
          <Projects />
          <Awards />
          <Tech />
          <Contact />
        </div>
      </main>
    </div>
  );
}
