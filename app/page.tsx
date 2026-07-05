import Starfield from "@/components/Starfield";
import CursorGlow from "@/components/CursorGlow";
import Sidebar from "@/components/Sidebar";
import About from "@/components/sections/About";
import Projects from "@/components/sections/Projects";
import Experience from "@/components/sections/Experience";
import Tech from "@/components/sections/Tech";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <div>
      <Starfield />
      <CursorGlow />
      <Sidebar />
      <main className="relative md:ml-[180px]">
        <div aria-hidden="true" className="coord-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-4xl px-6 pt-16 md:px-14 md:pt-0">
          <About />
          <Projects />
          <Experience />
          <Tech />
          <Contact />
        </div>
      </main>
    </div>
  );
}
