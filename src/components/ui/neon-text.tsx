import type { CSSProperties } from 'react';

export interface NeonLine {
  text: string;
  glowHex: string;
  tubeHex?: string;
}

/**
 * A lightweight neon rendering in plain CSS for cards and lists, where a canvas per item would be
 * too heavy. The studio uses the Konva canvas for the accurate preview.
 */
export function NeonText({
  lines,
  fontFamily,
  size = 'md',
  className = '',
}: {
  lines: NeonLine[];
  fontFamily: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const fontSize = { xs: 'text-[11px]', sm: 'text-xl', md: 'text-3xl', lg: 'text-5xl md:text-6xl' }[size];
  return (
    <span
      className={`block text-center leading-tight ${fontSize} ${className}`}
      style={{ fontFamily: `"${fontFamily}", cursive` }}
    >
      {lines.map((line, i) => (
        <span key={i} className="block" style={glow(line)}>
          {line.text}
        </span>
      ))}
    </span>
  );
}

function glow({ glowHex, tubeHex }: NeonLine): CSSProperties {
  return {
    color: tubeHex ?? '#fff',
    textShadow: `0 0 4px ${glowHex}, 0 0 12px ${glowHex}, 0 0 28px ${glowHex}, 0 0 48px ${glowHex}`,
  };
}

/** The dark wall the CSS neon sits on. */
export function NeonBackdrop({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid place-items-center bg-[radial-gradient(ellipse_at_center,#1c1c2a,#07070b_75%)] px-4 ${className}`}
    >
      {children}
    </div>
  );
}
