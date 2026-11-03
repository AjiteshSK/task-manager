/** A grey placeholder block shown while content loads. Hidden from screen readers. */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`animate-pulse rounded-md bg-slate-200 ${className}`} />
  );
}
