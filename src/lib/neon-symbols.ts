/**
 * Neon symbols drawn as single strokes in a 100 × 100 box, the way a neon bender shapes a tube:
 * each path is the centre line of one tube. Customers add them by typing an emoji or symbol
 * (❤️ ♾️ 🌹 ⭐ 🌙 …) anywhere in their words.
 */

export interface NeonSymbol {
  id: string;
  name: string;
  /** SVG path data in a 100 × 100 box, y down. */
  paths: string[];
}

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;

function polygon(points: [number, number][]) {
  return `M${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L')} Z`;
}

function star(cx: number, cy: number, outer: number, inner: number, count = 5) {
  return polygon(
    Array.from({ length: count * 2 }, (_, i) => {
      const r = i % 2 ? inner : outer;
      const a = (i / (count * 2)) * Math.PI * 2 - Math.PI / 2;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    }),
  );
}

/** Mirrors a path drawn on the left half to the right half. */
function mirror(path: string) {
  return path.replace(
    /(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g,
    (_, x: string, y: string) => `${100 - Number(x)} ${y}`,
  );
}

const LEFT_WING =
  'M47 46 C34 30 16 26 6 34 C16 38 20 41 22 45 C12 47 8 53 7 59 C17 57 24 55 29 56 C24 62 24 68 26 74 C36 66 44 56 47 46';
const BUTTERFLY_UPPER = 'M50 42 C40 18 14 14 12 32 C11 44 30 50 50 48';
const BUTTERFLY_LOWER = 'M50 52 C36 52 22 60 26 74 C30 84 44 76 50 60';

export const NEON_SYMBOLS: NeonSymbol[] = [
  {
    id: 'heart',
    name: 'Heart',
    paths: ['M50 86 C20 66 6 46 14 28 C21 12 42 12 50 30 C58 12 79 12 86 28 C94 46 80 66 50 86 Z'],
  },
  {
    id: 'infinity',
    name: 'Infinity',
    paths: ['M50 50 C40 32 14 32 14 50 C14 68 40 68 50 50 C60 32 86 32 86 50 C86 68 60 68 50 50 Z'],
  },
  {
    id: 'rose',
    name: 'Rose',
    paths: [
      'M50 34 C44 33 42 40 48 42 C54 44 57 37 52 34',
      'M50 22 C34 21 30 44 50 48 C70 44 66 21 50 22',
      'M36 30 C26 40 32 56 50 58 C68 56 74 40 64 30',
      'M50 58 C49 70 50 82 49 94',
      'M50 76 C42 70 34 72 30 64 C40 63 46 68 50 76',
      'M50 84 C56 78 64 78 68 72 C60 70 54 74 50 84',
    ],
  },
  {
    id: 'flower',
    name: 'Flower',
    paths: [
      ...Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        const x = 50 + Math.cos(a) * 20;
        const y = 42 + Math.sin(a) * 20;
        return circle(Number(x.toFixed(2)), Number(y.toFixed(2)), 12);
      }),
      circle(50, 42, 7),
    ],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    paths: [
      BUTTERFLY_UPPER,
      mirror(BUTTERFLY_UPPER),
      BUTTERFLY_LOWER,
      mirror(BUTTERFLY_LOWER),
      'M50 34 L50 74',
      'M49 34 C46 24 42 18 36 14',
      'M51 34 C54 24 58 18 64 14',
    ],
  },
  { id: 'star', name: 'Star', paths: [star(50, 52, 42, 18)] },
  { id: 'sparkle', name: 'Sparkle', paths: [star(50, 50, 44, 9, 4), star(82, 18, 12, 3, 4)] },
  { id: 'moon', name: 'Moon', paths: ['M64 12 A38 38 0 1 0 88 72 A30 30 0 1 1 64 12 Z'] },
  { id: 'wings', name: 'Wings', paths: [LEFT_WING, mirror(LEFT_WING)] },
  {
    id: 'crown',
    name: 'Crown',
    paths: ['M14 74 L18 32 L34 54 L50 22 L66 54 L82 32 L86 74 Z', 'M14 84 L86 84', circle(50, 14, 5)],
  },
  {
    id: 'diamond',
    name: 'Diamond',
    paths: ['M28 22 L72 22 L90 42 L50 88 L10 42 Z', 'M10 42 L90 42', 'M28 22 L40 42 L50 88 L60 42 L72 22'],
  },
  {
    id: 'arrow',
    name: 'Arrow',
    paths: [
      'M8 74 L92 26',
      'M92 26 L76 27 M92 26 L86 41',
      'M8 74 L14 62 M8 74 L20 77 M16 69 L22 57 M16 69 L28 72',
    ],
  },
  {
    id: 'lips',
    name: 'Lips',
    paths: ['M8 50 C24 30 40 30 50 40 C60 30 76 30 92 50 C76 74 24 74 8 50 Z', 'M8 50 C34 56 66 56 92 50'],
  },
  { id: 'ring', name: 'Ring', paths: [circle(50, 62, 28), 'M40 34 L50 18 L60 34 L50 40 Z'] },
  {
    id: 'music',
    name: 'Music note',
    paths: ['M44 76 L44 20 L80 12 L80 66', 'M44 30 L80 22', circle(34, 76, 10), circle(70, 68, 10)],
  },
  { id: 'lightning', name: 'Lightning', paths: ['M60 6 L26 54 L48 54 L38 94 L76 40 L54 40 Z'] },
  {
    id: 'fire',
    name: 'Flame',
    paths: [
      'M50 92 C24 88 20 62 36 40 C36 54 44 58 46 58 C40 40 48 22 62 10 C60 32 80 44 78 66 C76 84 64 92 50 92 Z',
      'M50 84 C40 82 38 70 46 62 C48 70 54 70 56 64 C62 72 60 84 50 84 Z',
    ],
  },
  {
    id: 'cake',
    name: 'Cake',
    paths: [
      'M20 58 L80 58 L80 88 L20 88 Z',
      'M20 68 C30 76 40 62 50 70 C60 78 70 62 80 68',
      'M38 58 L38 42 M50 58 L50 38 M62 58 L62 42',
      'M38 36 C34 30 38 24 38 22 C42 26 42 32 38 36 Z',
      'M50 32 C46 26 50 20 50 18 C54 22 54 28 50 32 Z',
      'M62 36 C58 30 62 24 62 22 C66 26 66 32 62 36 Z',
    ],
  },
  {
    id: 'balloon',
    name: 'Balloon',
    paths: [
      'M50 66 C24 62 20 30 36 16 C46 8 62 10 70 22 C82 42 70 64 50 66 Z',
      'M50 66 L46 72 L54 72 Z',
      'M50 72 C42 80 58 86 50 96',
    ],
  },
  {
    id: 'smile',
    name: 'Smile',
    paths: [circle(50, 50, 40), circle(36, 40, 4), circle(64, 40, 4), 'M30 58 C40 74 60 74 70 58'],
  },
  {
    id: 'sun',
    name: 'Sun',
    paths: [
      circle(50, 50, 18),
      ...Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const p = (r: number) => `${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r).toFixed(2)}`;
        return `M${p(28)} L${p(44)}`;
      }),
    ],
  },
  { id: 'circle', name: 'Circle', paths: [circle(50, 50, 42)] },
  { id: 'triangle', name: 'Triangle', paths: ['M50 10 L92 84 L8 84 Z'] },
  {
    id: 'hexagon',
    name: 'Hexagon',
    paths: [
      polygon(
        Array.from({ length: 6 }, (_, i): [number, number] => {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
          return [50 + Math.cos(a) * 44, 50 + Math.sin(a) * 44];
        }),
      ),
    ],
  },
  { id: 'square', name: 'Square', paths: ['M12 12 L88 12 L88 88 L12 88 Z'] },
];

const BY_ID = new Map(NEON_SYMBOLS.map((symbol) => [symbol.id, symbol]));

/** Emojis and typed symbols that become neon symbols. Variation selectors are ignored. */
const CHARACTERS: Record<string, string> = {
  '❤': 'heart',
  '♥': 'heart',
  '💖': 'heart',
  '💕': 'heart',
  '💘': 'heart',
  '💗': 'heart',
  '🧡': 'heart',
  '💛': 'heart',
  '💚': 'heart',
  '💙': 'heart',
  '💜': 'heart',
  '🤍': 'heart',
  '😍': 'heart',
  '♾': 'infinity',
  '∞': 'infinity',
  '🌹': 'rose',
  '🥀': 'rose',
  '🌸': 'flower',
  '🌼': 'flower',
  '🌺': 'flower',
  '🌻': 'flower',
  '💐': 'flower',
  '🪷': 'flower',
  '✿': 'flower',
  '❀': 'flower',
  '🦋': 'butterfly',
  '⭐': 'star',
  '★': 'star',
  '☆': 'star',
  '🌟': 'star',
  '✨': 'sparkle',
  '✦': 'sparkle',
  '✧': 'sparkle',
  '🎇': 'sparkle',
  '🎆': 'sparkle',
  '🌙': 'moon',
  '☾': 'moon',
  '☽': 'moon',
  '🌛': 'moon',
  '🌜': 'moon',
  '🪽': 'wings',
  '👼': 'wings',
  '👑': 'crown',
  '♛': 'crown',
  '♔': 'crown',
  '💎': 'diamond',
  '◆': 'diamond',
  '♦': 'diamond',
  '💘‍': 'arrow',
  '➶': 'arrow',
  '➵': 'arrow',
  '🏹': 'arrow',
  '💋': 'lips',
  '👄': 'lips',
  '💍': 'ring',
  '🎵': 'music',
  '🎶': 'music',
  '♪': 'music',
  '♫': 'music',
  '♬': 'music',
  '⚡': 'lightning',
  '🌩': 'lightning',
  '🔥': 'fire',
  '🎂': 'cake',
  '🍰': 'cake',
  '🧁': 'cake',
  '🎈': 'balloon',
  '😊': 'smile',
  '🙂': 'smile',
  '😀': 'smile',
  '😄': 'smile',
  '😎': 'smile',
  '🥳': 'smile',
  '☀': 'sun',
  '🌞': 'sun',
  '●': 'circle',
  '○': 'circle',
  '⭕': 'circle',
  '▲': 'triangle',
  '△': 'triangle',
  '⬢': 'hexagon',
  '⬡': 'hexagon',
  '■': 'square',
  '□': 'square',
};

/** The symbol for one grapheme (an emoji or character), if there is one. */
export function symbolFor(grapheme: string): NeonSymbol | null {
  const plain = grapheme.replace(/[\uFE0E\uFE0F]/g, '');
  const id = CHARACTERS[plain] ?? CHARACTERS[plain.slice(0, 2)] ?? CHARACTERS[plain[0] ?? ''];
  return id ? (BY_ID.get(id) ?? null) : null;
}

/** The character a picker inserts for each symbol, chosen to be easy to read in a text box. */
export const SYMBOL_CHARACTERS: Record<string, string> = {
  heart: '❤️',
  infinity: '♾️',
  rose: '🌹',
  flower: '🌸',
  butterfly: '🦋',
  star: '⭐',
  sparkle: '✨',
  moon: '🌙',
  wings: '🪽',
  crown: '👑',
  diamond: '💎',
  arrow: '🏹',
  lips: '💋',
  ring: '💍',
  music: '🎵',
  lightning: '⚡',
  fire: '🔥',
  cake: '🎂',
  balloon: '🎈',
  smile: '😊',
  sun: '☀️',
  circle: '●',
  triangle: '▲',
  hexagon: '⬢',
  square: '■',
};

export interface Segment {
  kind: 'text' | 'symbol';
  text: string;
  symbol?: NeonSymbol;
}

/**
 * Splits a line into runs of text and symbols. Emojis without a neon symbol are dropped from the
 * sign (a neon bender cannot make them) and reported so the page can say so.
 */
export function segmentLine(line: string): { segments: Segment[]; unsupported: string[] } {
  const segments: Segment[] = [];
  const unsupported: string[] = [];
  const graphemes =
    typeof Intl !== 'undefined' && 'Segmenter' in Intl
      ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(line)].map(
          (part) => part.segment,
        )
      : Array.from(line);
  for (const grapheme of graphemes) {
    const symbol = symbolFor(grapheme);
    if (symbol) {
      segments.push({ kind: 'symbol', text: grapheme, symbol });
      continue;
    }
    if (/\p{Extended_Pictographic}/u.test(grapheme)) {
      unsupported.push(grapheme);
      continue;
    }
    // Variation selectors and joiners are invisible; fonts would draw them as boxes.
    const visible = grapheme.replace(/[\uFE0E\uFE0F\u200D]/g, '');
    if (!visible) continue;
    const last = segments.at(-1);
    if (last?.kind === 'text') last.text += visible;
    else segments.push({ kind: 'text', text: visible });
  }
  return { segments, unsupported };
}
