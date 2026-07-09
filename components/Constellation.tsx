import { CONSTELLATIONS, type ConstellationName } from "@/lib/constellations";

export default function Constellation({
  name,
  className,
  prominent = false,
}: {
  name: ConstellationName;
  className?: string;
  prominent?: boolean;
}) {
  const { stars, edges } = CONSTELLATIONS[name];
  const lineAlpha = prominent ? 0.17 : 0.12;
  const starAlpha = prominent ? 0.52 : 0.4;

  return (
    <svg
      viewBox="0 0 300 260"
      className={className}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke={`rgba(232, 226, 211, ${lineAlpha})`} strokeWidth="1">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={stars[a][0]}
            y1={stars[a][1]}
            x2={stars[b][0]}
            y2={stars[b][1]}
          />
        ))}
      </g>
      {stars.map(([x, y, r], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill={`rgba(232, 226, 211, ${starAlpha})`}
          className="constellation-star"
          style={{ animationDelay: `-${((i * 1.3) % 5).toFixed(2)}s` }}
        />
      ))}
    </svg>
  );
}
