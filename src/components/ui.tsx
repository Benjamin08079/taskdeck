export const inputClass =
  "w-full brutal-sm bg-[var(--brutal-surface)] px-3 py-2 text-sm font-medium text-[var(--brutal-text)] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-lime-400";

export const primaryBtn =
  "brutal-sm bg-lime-400 px-4 py-2 text-sm font-bold uppercase tracking-wide text-black transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryBtn =
  "brutal-sm bg-[var(--brutal-surface)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-[var(--brutal-text)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none";

export const cardClass = "brutal bg-[var(--brutal-surface)]";

export const panelHeader =
  "flex items-center justify-between border-b-2 border-[var(--brutal-border)] bg-[var(--brutal-border)] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--brutal-bg)]";

export const miniBtn =
  "b2 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide transition hover:bg-lime-400 hover:text-black";

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="b2 bg-[var(--brutal-surface)] py-10 text-center">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest">
        {title}
      </p>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{hint}</p>
    </div>
  );
}
