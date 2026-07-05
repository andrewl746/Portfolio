import { TECH_STACK } from "@/lib/techstack";
import Constellation from "@/components/Constellation";

export default function Tech() {
  return (
    <section id="tech" className="relative scroll-mt-24 py-20">
      <Constellation
        name="orion"
        className="pointer-events-none absolute top-6 right-2 w-56 max-md:hidden"
      />
      <h2 className="font-serif text-3xl text-primary">Tech</h2>
      <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {TECH_STACK.map((t) => (
          <div
            key={t.name}
            className="group flex flex-col items-center gap-3 border border-white/8 bg-void px-4 py-6 transition-colors hover:border-white/20 hover:bg-[#0a0c14]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 opacity-35 grayscale transition-all duration-200 group-hover:opacity-100 group-hover:grayscale-0"
              fill={t.hex}
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d={t.path} />
            </svg>
            <span className="text-[10px] uppercase tracking-[0.1em] text-dim transition-colors group-hover:text-body">
              {t.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
