import type { ArtworkAspect, ArtworkOverlay, ArtworkStyle } from './artwork';

/**
 * Ready-made backgrounds drawn in code. They need no AI, so customers can always make a design,
 * even when the day's AI allowance is used up. Each is drawn on a 1024 square and cropped to the
 * chosen shape; the customer's words go on top exactly as for AI pictures.
 */
export interface Background {
  id: string;
  name: string;
  style: Exclude<ArtworkStyle, 'auto'>;
  /** Lettering that suits the background, used until the customer changes it. */
  look: Omit<ArtworkOverlay, 'lines'>;
  /** Placeholder words shown when the customer has not typed any. */
  sample: string[];
  draw: (random: () => number) => string;
}

const SIZES: Record<ArtworkAspect, [number, number]> = {
  square: [1024, 1024],
  portrait: [768, 1024],
  landscape: [1024, 768],
};

/** A small seeded generator, so a background looks the same every time it is drawn. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function backgroundSvg(background: Background, aspect: ArtworkAspect): string {
  const [width, height] = SIZES[aspect];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1024 1024" preserveAspectRatio="xMidYMid slice">${background.draw(seeded(background.id.length * 7919))}</svg>`;
}

export function backgroundDataUrl(background: Background, aspect: ArtworkAspect): string {
  const svg = backgroundSvg(background, aspect);
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

// ---------------------------------------------------------------------------------------------
// Drawing helpers

const heartPath = (x: number, y: number, size: number) => {
  const s = size / 2;
  return `M${x} ${y + s * 0.9} C${x - s * 1.6} ${y - s * 0.2} ${x - s * 0.9} ${y - s * 1.5} ${x} ${y - s * 0.6} C${x + s * 0.9} ${y - s * 1.5} ${x + s * 1.6} ${y - s * 0.2} ${x} ${y + s * 0.9} Z`;
};

function rose(x: number, y: number, r: number, dark: string, mid: string, light: string, turn = 0) {
  const petals: string[] = [];
  const rings: [number, number, string][] = [
    [1, 7, dark],
    [0.78, 6, mid],
    [0.55, 5, mid],
    [0.34, 4, light],
  ];
  for (const [scale, count, color] of rings) {
    for (let i = 0; i < count; i++) {
      const angle = turn + (i / count) * Math.PI * 2 + scale * 2;
      const px = x + Math.cos(angle) * r * scale * 0.45;
      const py = y + Math.sin(angle) * r * scale * 0.45;
      petals.push(
        `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${(r * scale * 0.62).toFixed(1)}" ry="${(r * scale * 0.42).toFixed(1)}" transform="rotate(${((angle * 180) / Math.PI).toFixed(0)} ${px.toFixed(1)} ${py.toFixed(1)})" fill="${color}" stroke="${dark}" stroke-opacity="0.35" stroke-width="2"/>`,
      );
    }
  }
  petals.push(`<circle cx="${x}" cy="${y}" r="${(r * 0.16).toFixed(1)}" fill="${dark}"/>`);
  return petals.join('');
}

function leaf(x: number, y: number, size: number, angle: number, color: string) {
  return `<path d="M0 0 C${size * 0.4} ${-size * 0.35} ${size * 0.8} ${-size * 0.2} ${size} 0 C${size * 0.8} ${size * 0.2} ${size * 0.4} ${size * 0.35} 0 0 Z" transform="translate(${x} ${y}) rotate(${angle})" fill="${color}"/><path d="M0 0 L${size * 0.9} 0" transform="translate(${x} ${y}) rotate(${angle})" stroke="#0b3d24" stroke-opacity="0.4" stroke-width="2"/>`;
}

function flower(x: number, y: number, r: number, petal: string, centre: string, count = 6, turn = 0) {
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const angle = turn + (i / count) * 360;
    parts.push(
      `<ellipse cx="${x}" cy="${y - r * 0.55}" rx="${r * 0.32}" ry="${r * 0.55}" transform="rotate(${angle} ${x} ${y})" fill="${petal}"/>`,
    );
  }
  parts.push(`<circle cx="${x}" cy="${y}" r="${r * 0.22}" fill="${centre}"/>`);
  return parts.join('');
}

function balloon(x: number, y: number, r: number, color: string, shine: string) {
  return `<path d="M${x} ${y + r * 1.2} q${-r * 0.3} ${r * 0.9} ${r * 0.2} ${r * 2.2}" stroke="${shine}" stroke-opacity="0.6" stroke-width="2" fill="none"/><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.2}" fill="${color}"/><path d="M${x - 8} ${y + r * 1.18} l8 14 l8 -14 z" fill="${color}"/><ellipse cx="${x - r * 0.35}" cy="${y - r * 0.45}" rx="${r * 0.22}" ry="${r * 0.36}" fill="${shine}" fill-opacity="0.55" transform="rotate(-25 ${x - r * 0.35} ${y - r * 0.45})"/>`;
}

function scatter(
  random: () => number,
  count: number,
  shape: (x: number, y: number, i: number) => string,
  avoidCentre = true,
) {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = random() * 1024;
    const y = random() * 1024;
    if (avoidCentre && Math.abs(x - 512) < 300 && Math.abs(y - 512) < 160) continue;
    out.push(shape(x, y, i));
  }
  return out.join('');
}

const glow = (id: string, blur: number) =>
  `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${blur}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

// ---------------------------------------------------------------------------------------------
// The backgrounds

export const BACKGROUNDS: Background[] = [
  {
    id: 'rose-romance',
    name: 'Rose romance',
    style: 'romantic',
    look: { font: 'Great Vibes', color: '#fff1f4', glow: '#ff2d55', placement: 'center' },
    sample: ['Rahul ❤️ Priya'],
    draw: (random) => {
      const roses = [
        [150, 170, 120, 0.2],
        [300, 90, 80, 1.1],
        [890, 160, 130, 0.7],
        [760, 70, 70, 2],
        [130, 880, 130, 1.4],
        [300, 960, 85, 0.4],
        [880, 870, 125, 2.4],
        [720, 970, 80, 0.9],
      ]
        .map(([x, y, r, t], i) => {
          const leaves = [0, 1, 2]
            .map((k) => leaf(x!, y!, r! * 1.1, (i * 47 + k * 120) % 360, k % 2 ? '#1f6b3a' : '#2c8a4b'))
            .join('');
          return leaves + rose(x!, y!, r!, '#7a0019', '#c1121f', '#ff4d6d', t!);
        })
        .join('');
      const hearts = scatter(random, 26, (x, y) => {
        const size = 18 + random() * 34;
        return `<path d="${heartPath(x, y, size)}" fill="#ff4d6d" fill-opacity="${(0.35 + random() * 0.5).toFixed(2)}" filter="url(#g)"/>`;
      });
      return `<defs><radialGradient id="bg" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#5c0a1c"/><stop offset="0.6" stop-color="#2a0510"/><stop offset="1" stop-color="#120206"/></radialGradient>${glow('g', 6)}</defs><rect width="1024" height="1024" fill="url(#bg)"/>${scatter(random, 60, (x, y) => `<circle cx="${x}" cy="${y}" r="${(random() * 22 + 6).toFixed(1)}" fill="#ff8fa3" fill-opacity="${(random() * 0.12).toFixed(2)}"/>`, false)}${hearts}${roses}`;
    },
  },
  {
    id: 'neon-hearts',
    name: 'Neon hearts',
    style: 'neon',
    look: { font: 'Tilt Neon', color: '#ffe3f1', glow: '#ff2e88', placement: 'center' },
    sample: ['Forever us'],
    draw: (random) => {
      const hearts = scatter(random, 22, (x, y) => {
        const size = 40 + random() * 90;
        const color = random() > 0.5 ? '#ff2e88' : '#22d3ee';
        return `<path d="${heartPath(x, y, size)}" fill="none" stroke="${color}" stroke-width="${(4 + random() * 4).toFixed(1)}" filter="url(#g)"/>`;
      });
      const bricks = Array.from({ length: 22 }, (_, row) =>
        Array.from(
          { length: 9 },
          (_, col) =>
            `<rect x="${col * 120 + (row % 2) * 60 - 60}" y="${row * 48}" width="114" height="42" rx="3" fill="#1a1424"/>`,
        ).join(''),
      ).join('');
      return `<defs>${glow('g', 9)}<radialGradient id="v" cx="50%" cy="50%" r="65%"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/></radialGradient></defs><rect width="1024" height="1024" fill="#0d0a14"/>${bricks}${hearts}<rect width="1024" height="1024" fill="url(#v)"/>`;
    },
  },
  {
    id: 'golden-birthday',
    name: 'Golden birthday',
    style: 'festive',
    look: { font: 'Pacifico', color: '#fff7e0', glow: '#e0a526', placement: 'center' },
    sample: ['Happy Birthday', 'Ananya 🎂'],
    draw: (random) => {
      const balloons = [
        [120, 230, 70, '#e8b84a'],
        [240, 140, 62, '#f5d27a'],
        [90, 470, 58, '#ffffff'],
        [900, 230, 72, '#e8b84a'],
        [780, 130, 60, '#ffffff'],
        [940, 480, 56, '#f5d27a'],
      ]
        .map(([x, y, r, c]) => balloon(x as number, y as number, r as number, c as string, '#fffaf0'))
        .join('');
      const confetti = scatter(random, 140, (x, y) => {
        const colors = ['#e8b84a', '#f5d27a', '#ffffff', '#d4a017'];
        return `<rect x="${x}" y="${y}" width="${(6 + random() * 10).toFixed(0)}" height="${(3 + random() * 5).toFixed(0)}" fill="${colors[Math.floor(random() * colors.length)]}" transform="rotate(${(random() * 180).toFixed(0)} ${x} ${y})"/>`;
      });
      const cake = `<g transform="translate(512 800)"><ellipse cx="0" cy="170" rx="260" ry="34" fill="#000" fill-opacity="0.25"/><rect x="-220" y="40" width="440" height="130" rx="18" fill="url(#gold)"/><rect x="-170" y="-60" width="340" height="110" rx="16" fill="#fff4dc"/><path d="M-170 -20 q42 30 85 0 t85 0 t85 0 t85 0" stroke="#e8b84a" stroke-width="10" fill="none"/>${[-110, -40, 40, 110].map((x) => `<rect x="${x - 7}" y="-125" width="14" height="66" rx="5" fill="#ffffff"/><path d="M${x} -150 q-12 16 0 26 q12 -10 0 -26" fill="#ffb02e" filter="url(#g)"/>`).join('')}</g>`;
      return `<defs><radialGradient id="bg" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#3b2a12"/><stop offset="1" stop-color="#140d04"/></radialGradient><linearGradient id="gold" x1="0" x2="1"><stop offset="0" stop-color="#b8860b"/><stop offset="0.5" stop-color="#f5d27a"/><stop offset="1" stop-color="#b8860b"/></linearGradient>${glow('g', 5)}</defs><rect width="1024" height="1024" fill="url(#bg)"/>${confetti}${balloons}${cake}`;
    },
  },
  {
    id: 'pink-party',
    name: 'Pink party',
    style: 'festive',
    look: { font: 'Lobster', color: '#ffffff', glow: '#ff4fa3', placement: 'center' },
    sample: ["Let's party! 🎉"],
    draw: (random) => {
      const colors = ['#ff6fb5', '#ffb3d9', '#c77dff', '#ffd6e8'];
      const balloons = scatter(random, 16, (x, y) =>
        balloon(x, y, 46 + random() * 30, colors[Math.floor(random() * colors.length)]!, '#ffffff'),
      );
      const confetti = scatter(
        random,
        120,
        (x, y) =>
          `<circle cx="${x}" cy="${y}" r="${(3 + random() * 6).toFixed(1)}" fill="${colors[Math.floor(random() * colors.length)]}"/>`,
        false,
      );
      return `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd1e8"/><stop offset="1" stop-color="#f3a6d0"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#bg)"/>${confetti}${balloons}<path d="M0 60 Q256 140 512 60 T1024 60" stroke="#ffffff" stroke-width="6" fill="none"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 128 + 20} ${70 + Math.sin(i) * 20} l40 0 l-20 46 z" fill="${colors[i % colors.length]}"/>`).join('')}`;
    },
  },
  {
    id: 'diwali-diyas',
    name: 'Diwali diyas',
    style: 'festive',
    look: { font: 'Great Vibes', color: '#fff3c4', glow: '#ff9f1c', placement: 'center' },
    sample: ['Happy Diwali 🪔'],
    draw: (random) => {
      const diya = (x: number, y: number, s: number) =>
        `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-70 0 Q0 60 70 0 Q60 -12 0 -10 Q-60 -12 -70 0 Z" fill="url(#clay)"/><path d="M-50 4 Q0 30 50 4" stroke="#ffd166" stroke-width="5" fill="none"/><path d="M0 -14 q-16 -26 0 -62 q16 36 0 62 z" fill="#ffb703" filter="url(#g)"/><path d="M0 -18 q-7 -14 0 -34 q7 20 0 34 z" fill="#fff3b0"/></g>`;
      const diyas = [
        [150, 880, 1.3],
        [330, 930, 1],
        [512, 900, 1.2],
        [700, 930, 1],
        [880, 880, 1.3],
      ]
        .map(([x, y, s]) => diya(x!, y!, s!))
        .join('');
      const sparkles = scatter(
        random,
        90,
        (x, y) =>
          `<circle cx="${x}" cy="${y * 0.75}" r="${(1 + random() * 3).toFixed(1)}" fill="#ffd166" fill-opacity="${(0.4 + random() * 0.6).toFixed(2)}"/>`,
        false,
      );
      const rangoli = Array.from({ length: 12 }, (_, i) =>
        flower(512, 150, 120 - i * 9, i % 2 ? '#ff6b6b' : '#ffd166', '#7b2cbf', 8, i * 15),
      ).join('');
      return `<defs><radialGradient id="bg" cx="50%" cy="90%" r="90%"><stop offset="0" stop-color="#5a1e02"/><stop offset="0.5" stop-color="#22072e"/><stop offset="1" stop-color="#0b0418"/></radialGradient><linearGradient id="clay" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e76f51"/><stop offset="1" stop-color="#8c2f1b"/></linearGradient>${glow('g', 8)}</defs><rect width="1024" height="1024" fill="url(#bg)"/>${sparkles}<g opacity="0.85">${rangoli}</g>${diyas}`;
    },
  },
  {
    id: 'blue-florals',
    name: 'Blue florals',
    style: 'minimalist',
    look: { font: 'Sacramento', color: '#1e3a5f', glow: '#7fb3ff', placement: 'center' },
    sample: ["You're invited"],
    draw: (random) => {
      const corner = (cx: number, cy: number, flip: number) =>
        Array.from({ length: 9 }, () => {
          const x = cx + flip * random() * 230;
          const y = cy + (cy < 512 ? 1 : -1) * random() * 230;
          const r = 30 + random() * 46;
          return (
            leaf(x, y, r * 1.6, random() * 360, random() > 0.5 ? '#9cc5a1' : '#6fa37a') +
            flower(
              x,
              y,
              r,
              random() > 0.4 ? '#4f8fd6' : '#a9c9f5',
              random() > 0.5 ? '#ffffff' : '#f6d365',
              5 + Math.floor(random() * 3),
              random() * 60,
            )
          );
        }).join('');
      return `<rect width="1024" height="1024" fill="#fbfdff"/><rect x="60" y="60" width="904" height="904" rx="10" fill="none" stroke="#a9c9f5" stroke-width="3"/>${corner(70, 70, 1)}${corner(954, 954, -1)}${corner(954, 70, -1)}${corner(70, 954, 1)}`;
    },
  },
  {
    id: 'neon-arena',
    name: 'Neon arena',
    style: 'neon',
    look: { font: 'Bungee', color: '#e0fbff', glow: '#22d3ee', placement: 'center' },
    sample: ['RAVI 🔥'],
    draw: (random) => {
      const grid =
        Array.from(
          { length: 17 },
          (_, i) =>
            `<line x1="${512 + (i - 8) * 30}" y1="560" x2="${512 + (i - 8) * 160}" y2="1024" stroke="#c026d3" stroke-opacity="0.6" stroke-width="2"/>`,
        ).join('') +
        Array.from(
          { length: 9 },
          (_, i) =>
            `<line x1="0" y1="${560 + i * i * 6}" x2="1024" y2="${560 + i * i * 6}" stroke="#c026d3" stroke-opacity="0.5" stroke-width="2"/>`,
        ).join('');
      const stars = scatter(
        random,
        80,
        (x, y) =>
          `<circle cx="${x}" cy="${y * 0.55}" r="${(random() * 2).toFixed(1)}" fill="#ffffff" fill-opacity="${random().toFixed(2)}"/>`,
        false,
      );
      const bolts = [140, 884]
        .map(
          (x) =>
            `<path d="M${x} 180 l-40 120 h50 l-40 130" stroke="#22d3ee" stroke-width="10" fill="none" stroke-linejoin="round" filter="url(#g)"/>`,
        )
        .join('');
      return `<defs><linearGradient id="bg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#05010f"/><stop offset="0.55" stop-color="#1b0638"/><stop offset="1" stop-color="#05010f"/></linearGradient><radialGradient id="sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff2e88"/><stop offset="1" stop-color="#ff2e88" stop-opacity="0"/></radialGradient>${glow('g', 10)}</defs><rect width="1024" height="1024" fill="url(#bg)"/>${stars}<circle cx="512" cy="560" r="300" fill="url(#sun)" fill-opacity="0.45"/>${grid}${bolts}<rect x="40" y="40" width="944" height="944" fill="none" stroke="#22d3ee" stroke-width="4" filter="url(#g)"/>`;
    },
  },
  {
    id: 'royal-wedding',
    name: 'Royal wedding',
    style: 'luxury',
    look: { font: 'Great Vibes', color: '#7a5418', glow: '#e7c06b', placement: 'center' },
    sample: ['Amit & Neha', '12 · 02 · 2027'],
    draw: () => {
      const ring = (r: number, count: number, size: number) =>
        Array.from({ length: count }, (_, i) => {
          const a = (i / count) * Math.PI * 2;
          return flower(
            512 + Math.cos(a) * r,
            512 + Math.sin(a) * r,
            size,
            '#e7c06b',
            '#b8860b',
            6,
            (a * 180) / Math.PI,
          );
        }).join('');
      return `<defs><radialGradient id="bg" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f3e3c3"/></radialGradient></defs><rect width="1024" height="1024" fill="url(#bg)"/><circle cx="512" cy="512" r="430" fill="none" stroke="#d4a64a" stroke-width="3"/><circle cx="512" cy="512" r="400" fill="none" stroke="#d4a64a" stroke-width="1.5" stroke-dasharray="6 10"/>${ring(430, 36, 22)}${ring(470, 24, 14)}${[0, 90, 180, 270].map((a) => `<g transform="rotate(${a} 512 512)">${flower(512, 60, 46, '#d4a64a', '#fffaf0', 8)}${leaf(470, 70, 60, 200, '#c9a24a')}${leaf(554, 70, 60, -20, '#c9a24a')}</g>`).join('')}`;
    },
  },
  {
    id: 'starry-night',
    name: 'Starry night',
    style: 'minimalist',
    look: { font: 'Dancing Script', color: '#fdf6e3', glow: '#9db4ff', placement: 'center' },
    sample: ['Eid Mubarak 🌙'],
    draw: (random) => {
      const stars = scatter(
        random,
        160,
        (x, y) => {
          const r = random() * 2.6 + 0.4;
          return `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="#ffffff" fill-opacity="${(0.3 + random() * 0.7).toFixed(2)}"${r > 2.4 ? ' filter="url(#g)"' : ''}/>`;
        },
        false,
      );
      return `<defs><linearGradient id="bg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#0b1026"/><stop offset="1" stop-color="#1d2b64"/></linearGradient>${glow('g', 4)}</defs><rect width="1024" height="1024" fill="url(#bg)"/>${stars}<g filter="url(#g)"><circle cx="800" cy="210" r="96" fill="#fff3c4"/><circle cx="840" cy="180" r="90" fill="#0f1733"/></g><path d="M0 900 Q180 820 360 880 T720 860 T1024 880 V1024 H0 Z" fill="#070b1a"/>${[180, 300, 520, 760, 900].map((x, i) => `<path d="M${x} ${870 - i * 6} l-20 40 h40 z M${x} ${830 - i * 6} l-14 40 h28 z" fill="#0d1430"/>`).join('')}`;
    },
  },
  {
    id: 'sunset-glow',
    name: 'Sunset glow',
    style: 'minimalist',
    look: { font: 'Righteous', color: '#ffffff', glow: '#ff7a59', placement: 'center' },
    sample: ['Good vibes only ✨'],
    draw: () =>
      `<defs><linearGradient id="bg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2d1b69"/><stop offset="0.45" stop-color="#d1495b"/><stop offset="0.75" stop-color="#f79256"/><stop offset="1" stop-color="#fbd1a2"/></linearGradient><radialGradient id="sun"><stop offset="0" stop-color="#fff1c1"/><stop offset="1" stop-color="#ffb26b" stop-opacity="0"/></radialGradient></defs><rect width="1024" height="1024" fill="url(#bg)"/><circle cx="512" cy="720" r="260" fill="url(#sun)"/><circle cx="512" cy="720" r="130" fill="#ffe3a3"/>${Array.from({ length: 6 }, (_, i) => `<rect x="0" y="${730 + i * 26}" width="1024" height="${6 + i * 2}" fill="#2d1b69" fill-opacity="${0.15 + i * 0.12}"/>`).join('')}<path d="M0 860 Q260 800 512 850 T1024 840 V1024 H0 Z" fill="#2d1b69"/>`,
  },
];
