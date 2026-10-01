import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface IdeaCardProps {
  label: string;
  text: string;
  font: string;
  color: string;
}

export function IdeaCard({ label, text, font, color }: IdeaCardProps) {
  return (
    <Link
      href={`/studio?text=${encodeURIComponent(text)}`}
      className="group overflow-hidden rounded-2xl border border-white/5 bg-night-800 transition hover:border-white/20"
    >
      <div className="grid aspect-[4/3] place-items-center bg-[radial-gradient(ellipse_at_center,#1c1c2a,#07070b_75%)] px-4">
        <span
          className={`text-center leading-tight [overflow-wrap:anywhere] ${text.length > 12 ? 'text-2xl' : 'text-3xl'}`}
          style={{
            fontFamily: `"${font}", cursive`,
            color: '#fff',
            textShadow: `0 0 6px ${color}, 0 0 16px ${color}, 0 0 36px ${color}`,
          }}
        >
          {text}
        </span>
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-semibold">{label}</span>
        <ArrowUpRight className="size-4 text-muted transition group-hover:text-ink" />
      </div>
    </Link>
  );
}
