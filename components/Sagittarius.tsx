const STARS: [number, number, number][] = [
  [40, 150, 3],
  [95, 130, 3.5],
  [85, 195, 4],
  [135, 75, 3.5],
  [185, 110, 3],
  [230, 85, 4],
  [250, 130, 3],
  [215, 170, 3.5],
];

const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 3],
  [3, 4],
  [4, 1],
  [4, 7],
  [7, 2],
  [4, 5],
  [5, 6],
  [6, 7],
];

export default function Sagittarius({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 260"
      className={className}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="rgba(224, 70, 84, 0.3)" strokeWidth="1">
        {EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={STARS[a][0]}
            y1={STARS[a][1]}
            x2={STARS[b][0]}
            y2={STARS[b][1]}
          />
        ))}
      </g>
      {STARS.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r * 2.4} fill="rgba(224, 70, 84, 0.12)" />
          <circle
            cx={x}
            cy={y}
            r={r}
            fill="#f0e9ea"
            className="constellation-star"
            style={{ animationDelay: `${i * 0.7}s` }}
          />
        </g>
      ))}
    </svg>
  );
}
