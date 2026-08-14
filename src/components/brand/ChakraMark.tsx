import type { SVGProps } from "react";

export function ChakraMark({ className, size = 17 }: { className?: string; size?: number }) {
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180;
    return {
      x1: (12 + 2.4 * Math.cos(a)).toFixed(2),
      y1: (12 + 2.4 * Math.sin(a)).toFixed(2),
      x2: (12 + 8 * Math.cos(a)).toFixed(2),
      y2: (12 + 8 * Math.sin(a)).toFixed(2),
    };
  });
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FF9933"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="8.2" />
      <circle cx="12" cy="12" r="1.7" fill="#FF9933" stroke="none" />
      <g strokeWidth="1.05">
        {spokes.map((spoke) => (
          <line key={`${spoke.x1}-${spoke.y1}`} x1={spoke.x1} y1={spoke.y1} x2={spoke.x2} y2={spoke.y2} />
        ))}
      </g>
    </svg>
  );
}

export function PlayGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden {...props}>
      <path d="M2.5 1.6v8.8c0 .5.55.8.96.52l6.6-4.4a.62.62 0 0 0 0-1.04L3.46 1.08A.62.62 0 0 0 2.5 1.6z" />
    </svg>
  );
}

export function ArrowGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
