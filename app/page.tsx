import Starfield from "@/components/Starfield";
import Nav from "@/components/sections/Nav";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import Competition from "@/components/sections/Competition";
import Experience from "@/components/sections/Experience";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <div id="top">
      <Starfield />
      <Nav />
      <main>
        <Hero />
        <Projects />
        <Competition />
        <Experience />
        <Contact />
      </main>
    </div>
  );
}
