import { Lightbulb, LightbulbOff } from 'lucide-react';

export function LightSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-black/75"
    >
      {on ? <Lightbulb className="size-3.5 text-yellow-300" /> : <LightbulbOff className="size-3.5" />}
      {on ? 'Lights on' : 'Lights off'}
    </button>
  );
}
