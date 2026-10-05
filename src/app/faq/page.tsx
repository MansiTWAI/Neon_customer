import type { Metadata } from 'next';
import Link from 'next/link';
import { Faq, HOME_QUESTIONS, type Question } from '@/components/home/faq';

export const metadata: Metadata = {
  title: 'Questions and answers',
  description: 'Pricing, design proofs, delivery, installation, care and warranty for Neon Adda signs.',
  alternates: { canonical: '/faq' },
};

const GROUPS: { title: string; questions: Question[] }[] = [
  { title: 'Ordering', questions: HOME_QUESTIONS.slice(0, 2) },
  {
    title: 'Proofs and changes',
    questions: [
      {
        q: 'How many changes can I ask for?',
        a: 'Three rounds of changes to the proof are included with every sign. Tell us what to change right on your order page.',
      },
      {
        q: 'Can I change the design after approving the proof?',
        a: 'Once you approve, the sign goes into production. Raise a request from the order page straight away and we will do our best to catch it.',
      },
    ],
  },
  {
    title: 'Delivery and installation',
    questions: [
      ...HOME_QUESTIONS.slice(2, 4),
      {
        q: 'What comes in the box?',
        a: 'The sign, a 12 V adapter with a 2 m clear cable, wall screws and standoffs, and a mounting guide. A remote dimmer if you chose one.',
      },
    ],
  },
  {
    title: 'Care and warranty',
    questions: [
      HOME_QUESTIONS[4]!,
      {
        q: 'How long does LED neon last?',
        a: 'Around 50,000 hours of use, which is years of evenings. The LEDs and adapter carry a one-year warranty.',
      },
      {
        q: 'How do I clean it?',
        a: 'Switch it off and wipe it with a dry microfibre cloth. Avoid water and cleaning sprays on indoor signs.',
      },
    ],
  },
];

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: GROUPS.flatMap((group) =>
    group.questions.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  ),
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      <h1 className="font-display text-3xl font-bold">Questions and answers</h1>
      <p className="mt-2 text-muted">
        Something else on your mind?{' '}
        <Link href="/contact" className="text-neon-cyan hover:underline">
          Ask us
        </Link>
        .
      </p>
      {GROUPS.map((group) => (
        <section key={group.title} className="mt-10">
          <h2 className="font-display text-xl font-semibold">{group.title}</h2>
          <Faq questions={group.questions} />
        </section>
      ))}
    </div>
  );
}
