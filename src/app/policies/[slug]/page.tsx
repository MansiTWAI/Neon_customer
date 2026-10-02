import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { POLICIES } from '@/content/policies';

interface PolicyPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const policy = POLICIES[(await params).slug];
  return policy ? { title: policy.title, description: policy.summary } : {};
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 py-12 md:grid-cols-[200px_minmax(0,1fr)]">
      <nav aria-label="Policies" className="flex gap-2 overflow-x-auto text-sm md:flex-col md:gap-1">
        {Object.entries(POLICIES).map(([key, p]) => (
          <Link
            key={key}
            href={`/policies/${key}`}
            aria-current={key === slug ? 'page' : undefined}
            className={`shrink-0 rounded-lg px-3 py-1.5 transition ${
              key === slug ? 'bg-white/10 font-semibold' : 'text-muted hover:text-ink'
            }`}
          >
            {p.title}
          </Link>
        ))}
      </nav>
      <article>
        <h1 className="font-display text-3xl font-bold">{policy.title}</h1>
        <p className="mt-2 text-muted">{policy.summary}</p>
        {policy.sections.map((section) => (
          <section key={section.heading} className="mt-8">
            <h2 className="font-semibold">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}
