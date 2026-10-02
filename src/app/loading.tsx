/** Shown at once on navigation while the next page loads, so a tap never feels ignored. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-night-800" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-night-800" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-night-800" />
        ))}
      </div>
    </div>
  );
}
