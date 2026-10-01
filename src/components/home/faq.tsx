import { ChevronDown } from 'lucide-react';

export interface Question {
  q: string;
  a: string;
}

export const HOME_QUESTIONS: Question[] = [
  {
    q: 'How is the price worked out?',
    a: 'By size. We measure the finished sign in square feet and apply the rate for the backboard you choose. Extras such as a dimmer are added on top, and the studio shows the full breakup including GST.',
  },
  {
    q: 'Will the sign look exactly like the preview?',
    a: 'Very close. Before anything is made our designers send a final proof with exact tube placement for you to approve, and we only start once you have.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Most signs are made and dispatched within a week. You will see the delivery estimate for your pincode at checkout.',
  },
  {
    q: 'Can you install it?',
    a: 'Yes, in cities where we have installation partners. Every sign also ships with a mounting kit and instructions.',
  },
  {
    q: 'Is LED neon safe indoors?',
    a: 'Yes. LED neon runs cool on a 12 V adapter and uses a fraction of the power of glass neon. Choose outdoor waterproofing if it will face rain.',
  },
];

export function Faq({ questions = HOME_QUESTIONS }: { questions?: Question[] }) {
  return (
    <div className="mt-8 divide-y divide-white/5 rounded-2xl border border-white/5 bg-night-800">
      {questions.map(({ q, a }) => (
        <details key={q} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
            {q}
            <ChevronDown className="size-4 shrink-0 text-muted transition group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
        </details>
      ))}
    </div>
  );
}
