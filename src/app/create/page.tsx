import type { Metadata } from 'next';
import { AiDesigner } from '@/components/create/ai-designer';

export const metadata: Metadata = {
  title: 'AI designer: turn your idea into a personalised design',
  description:
    'Describe a design in your own words, with names, emojis and colours, and get an AI-painted picture with your words written exactly right. Download it or get it made.',
  alternates: { canonical: '/create' },
};

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="text-sm font-semibold tracking-wide text-neon-pink uppercase">AI designer</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          Say it in words. See it in light.
        </h1>
        <p className="mt-3 text-muted">
          Tell us the occasion, the names and the mood. Our AI paints the scene, and we write your words on
          top, letter-perfect, so &ldquo;Priya&rdquo; never comes out as &ldquo;Prya&rdquo;.
        </p>
      </header>
      <AiDesigner />
    </div>
  );
}
