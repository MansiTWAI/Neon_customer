export interface Idea {
  text: string;
  font: string;
  glowHex: string;
}

export interface UseCase {
  /** Short name for menus. */
  label: string;
  title: string;
  headline: string;
  intro: string;
  /** Catalogue tag whose products are shown on the page. */
  tag: string;
  ideas: Idea[];
  points: { title: string; body: string }[];
}

export const USE_CASES: Record<string, UseCase> = {
  bedroom: {
    label: 'Bedrooms',
    title: 'Neon signs for bedrooms',
    headline: 'A softer glow for your room',
    intro:
      'Your name, a line you love, or a single word above the bed. Warm colours and a dimmer make it a night light too.',
    tag: 'bedroom',
    ideas: [
      { text: 'Riya', font: 'Neonderthaw', glowHex: '#FF2E88' },
      { text: 'Sweet dreams', font: 'Sacramento', glowHex: '#D946EF' },
      { text: 'Good vibes', font: 'Pacifico', glowHex: '#22D3EE' },
    ],
    points: [
      { title: 'Add a dimmer', body: 'Turn it right down at night. The remote comes in the box.' },
      {
        title: 'Sized for the wall',
        body: 'Most bedroom signs are 24 to 36 inches wide. The studio shows it at true scale.',
      },
      { title: 'Cool to the touch', body: 'LED neon runs on a 12 V adapter, safe in kids’ rooms.' },
    ],
  },
  weddings: {
    label: 'Weddings',
    title: 'Neon signs for weddings',
    headline: 'The backdrop in every photo',
    intro:
      'Names, a hashtag or a date for the stage, the mehendi and the photo booth, then on your wall at home.',
    tag: 'wedding',
    ideas: [
      { text: 'Aarav & Isha', font: 'Great Vibes', glowHex: '#FFD89A' },
      { text: 'Better together', font: 'Great Vibes', glowHex: '#FFD89A' },
      { text: '#IshaWedsAarav', font: 'Satisfy', glowHex: '#FF2E88' },
    ],
    points: [
      {
        title: 'Order three weeks ahead',
        body: 'That leaves time for the proof, production and delivery before the big day.',
      },
      {
        title: 'Big stage signs',
        body: 'Anything over 8 feet is quoted by our team, with a mock-up on your venue photo.',
      },
      {
        title: 'Installed at the venue',
        body: 'In partner cities, our technician mounts it on the backdrop frame.',
      },
    ],
  },
  cafes: {
    label: 'Cafés and restaurants',
    title: 'Neon signs for cafés and restaurants',
    headline: 'Signs your customers photograph',
    intro: 'A line on the wall people tag you in, a menu highlight, or your name above the counter.',
    tag: 'cafe',
    ideas: [
      { text: 'But first, coffee', font: 'Yellowtail', glowHex: '#FFD89A' },
      { text: 'Chai & chill', font: 'Pacifico', glowHex: '#F97316' },
      { text: 'OPEN', font: 'Righteous', glowHex: '#EF4444' },
    ],
    points: [
      {
        title: 'Your logo in neon',
        body: 'Upload it in the logo studio and we send a quotation within a day.',
      },
      { title: 'GST invoice', body: 'Add your GSTIN at checkout to claim input credit.' },
      { title: 'Outdoor ready', body: 'Choose IP65 waterproofing for shop fronts that face the weather.' },
    ],
  },
  business: {
    label: 'Businesses',
    title: 'Neon signs for businesses',
    headline: 'Your brand, lit up',
    intro:
      'Reception walls, shop fronts, salons and studios. Logos, names and taglines, made to your brand colours.',
    tag: 'business',
    ideas: [
      { text: 'Hello gorgeous', font: 'Satisfy', glowHex: '#FF2E88' },
      { text: 'Hustle', font: 'Monoton', glowHex: '#8B5CF6' },
      { text: 'Welcome', font: 'Tilt Neon', glowHex: '#22D3EE' },
    ],
    points: [
      { title: 'Bulk and multi-store', body: 'Ordering for several branches? Ask for a bulk quotation.' },
      { title: 'Printed backboards', body: 'Put your brand colours or artwork behind the neon.' },
      {
        title: 'Installed and tested',
        body: 'Our partner technicians mount and test it on site in partner cities.',
      },
    ],
  },
  events: {
    label: 'Parties and events',
    title: 'Neon signs for parties and events',
    headline: 'Light up the party',
    intro: 'Birthdays, sangeets, launches and college fests. Bold colours that read from across the room.',
    tag: 'party',
    ideas: [
      { text: "Let's party", font: 'Monoton', glowHex: '#8B5CF6' },
      { text: 'Happy birthday', font: 'Lobster', glowHex: '#FACC15' },
      { text: 'Cheers', font: 'Yellowtail', glowHex: '#22C55E' },
    ],
    points: [
      {
        title: 'Keep it after',
        body: 'Every sign comes with wall mounts, so it goes up at home after the event.',
      },
      { title: 'Hanging kit', body: 'Add chains to hang it from a truss or a backdrop frame.' },
      {
        title: 'Last-minute?',
        body: 'Ready-made designs ship fastest. Check the delivery time for your pincode.',
      },
    ],
  },
};
