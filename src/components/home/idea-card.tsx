import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { NeonBackdrop, NeonBoard } from '@/components/ui/neon-text';

interface IdeaCardProps {
  label: string;
  text: string;
  font: string;
  color: string;
  /** Where the card leads; by default the 3D designer, starting from this text. */
  href?: string;
  /** A short line under the label. */
  note?: string;
}

export function IdeaCard({ label, text, font, color, href, note }: IdeaCardProps) {
  return (
    <Link
      href={href ?? `/create?text=${encodeURIComponent(text)}`}
      className="group block overflow-hidden rounded-2xl border border-white/5 bg-night-800 transition hover:border-white/20"
    >
      <NeonBackdrop className="aspect-[4/3] transition group-hover:brightness-110" glowHex={color}>
        <NeonBoard>
          <span
            className={`block text-center leading-tight [overflow-wrap:anywhere] ${text.length > 8 ? 'text-2xl' : 'text-3xl'}`}
            style={{
              fontFamily: `"${font}", cursive`,
              color: '#fff',
              textShadow: `0 0 4px ${color}, 0 0 12px ${color}, 0 0 28px ${color}`,
            }}
          >
            {text}
          </span>
        </NeonBoard>
      </NeonBackdrop>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="min-w-0">
          <span className="block font-semibold">{label}</span>
          {note && <span className="block text-xs text-muted">{note}</span>}
        </span>
        <ArrowUpRight className="size-4 shrink-0 text-muted transition group-hover:text-ink" />
      </div>
    </Link>
  );
}
