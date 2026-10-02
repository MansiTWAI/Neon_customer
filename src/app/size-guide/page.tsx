import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Size guide',
  description: 'How big should your neon sign be? Sizes for walls, headboards, counters and stages.',
};

const SIZES = [
  {
    name: 'Small',
    width: 18,
    where: 'Shelves, desks, bar carts and small walls',
    distance: 'Read from up to 3 m',
  },
  {
    name: 'Medium',
    width: 24,
    where: 'Above a bed or a sofa, café counters',
    distance: 'Read from up to 5 m',
  },
  {
    name: 'Large',
    width: 36,
    where: 'Feature walls, reception areas, shop interiors',
    distance: 'Read from up to 8 m',
  },
  {
    name: 'Extra large',
    width: 48,
    where: 'Stages, event backdrops, shop fronts',
    distance: 'Read from across a hall',
  },
];

export default function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Size guide</h1>
      <p className="mt-3 max-w-2xl text-muted">
        We quote signs by width. The height follows your lettering: a single short word is about a third as
        tall as it is wide, two lines about half. The studio shows the exact size as you type.
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-white/5 bg-night-800">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-white/5 text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Size</th>
              <th className="px-5 py-3 font-medium">Width</th>
              <th className="px-5 py-3 font-medium">Works well for</th>
              <th className="px-5 py-3 font-medium">Legible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {SIZES.map((size) => (
              <tr key={size.name}>
                <td className="px-5 py-4 font-semibold">{size.name}</td>
                <td className="px-5 py-4 tabular-nums">
                  {size.width}″ <span className="text-muted">({Math.round(size.width * 2.54)} cm)</span>
                </td>
                <td className="px-5 py-4 text-muted">{size.where}</td>
                <td className="px-5 py-4 text-muted">{size.distance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <h2 className="font-semibold">Measure the wall</h2>
          <p className="mt-2 text-sm text-muted">
            A sign looks best at about half to two-thirds the width of the space it fills, such as the
            headboard below it.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Leave room for cables</h2>
          <p className="mt-2 text-sm text-muted">
            The 2 m cable comes from one side. Plan for a socket within reach, or add the extra cable in the
            studio.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Try it on your wall</h2>
          <p className="mt-2 text-sm text-muted">
            In the studio, add a photo of your wall under Wall and see the sign at the size you choose.
          </p>
        </div>
      </section>

      <p className="mt-10 text-sm text-muted">
        Need something bigger than 8 feet?{' '}
        <Link href="/quote?kind=LARGE" className="font-semibold text-neon-cyan hover:underline">
          Ask for a quotation
        </Link>
        .
      </p>
    </div>
  );
}
