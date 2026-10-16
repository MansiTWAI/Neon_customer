/**
 * Product pictures for the catalogue's ready-made signs. Each is the real design (its words, font,
 * colours and backboard) rendered with the same 3D renderer as the designer: a front view on a
 * plain wall, an angled close-up of the tubes, board and standoffs, and the sign hung in a room.
 * The rooms behind the sign are AI pictures; the sign itself never is.
 *
 * Signs added in the admin panel later show their uploaded photo, or the lettering drawn in CSS.
 */
const RENDERED = new Set([
  'good-vibes-only',
  'but-first-coffee',
  'better-together',
  'mr-and-mrs',
  'lets-party',
  'dream-big',
  'hello-gorgeous',
  'game-on',
  'open',
  'stay-wild',
  'home-sweet-home',
]);

export interface SignPhotos {
  front: string;
  detail: string;
  room: string;
}

export function signPhotos(slug: string): SignPhotos | null {
  if (!RENDERED.has(slug)) return null;
  return {
    front: `/images/signs/${slug}.jpg`,
    detail: `/images/signs/${slug}-detail.jpg`,
    room: `/images/signs/${slug}-room.jpg`,
  };
}

/** Pictures for the home page and use-case pages, all rendered the same way. */
export const SCENES = {
  hero: '/images/signs/hero-living.jpg',
  nameSign: '/images/signs/name-bedroom.jpg',
  logoSign: '/images/signs/logo-office.jpg',
  coupleDetail: '/images/signs/couple-brick.jpg',
} as const;

/** A room picture for each catalogue category and use-case page. */
export const CATEGORY_SCENES: Record<string, string> = {
  'words-and-quotes': '/images/signs/good-vibes-only-room.jpg',
  'weddings-and-events': '/images/signs/better-together-room.jpg',
  'home-and-bedroom': '/images/signs/dream-big-room.jpg',
  'cafes-and-business': '/images/signs/but-first-coffee-room.jpg',
  bedroom: '/images/signs/home-sweet-home-room.jpg',
  weddings: '/images/signs/mr-and-mrs-room.jpg',
  gaming: '/images/signs/game-on-room.jpg',
  cafes: '/images/signs/but-first-coffee-room.jpg',
  business: '/images/signs/logo-office.jpg',
  events: '/images/signs/lets-party-room.jpg',
};
