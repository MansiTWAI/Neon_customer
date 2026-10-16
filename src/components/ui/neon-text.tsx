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

/** The wall the CSS neon hangs on: dim brick, washed in the sign's own colour. */
export function NeonBackdrop({
  children,
  className = '',
  glowHex,
}: {
  children: React.ReactNode;
  className?: string;
  /** The sign's colour, for the light it throws on the wall. */
  glowHex?: string;
}) {
  return (
    <div
      className={`neon-wall grid place-items-center px-4 ${className}`}
      style={glowHex ? ({ '--glow': glowHex } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

/** A clear acrylic board behind the lettering, as the sign is actually made. */
export function NeonBoard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`neon-board max-w-full px-[6%] py-[5%] ${className}`}>{children}</div>;
}
