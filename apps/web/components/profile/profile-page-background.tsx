export function ProfilePageBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(45,212,191,0.10),transparent_34%),radial-gradient(circle_at_92%_8%,rgba(167,139,250,0.12),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.08),transparent_40%)] dark:opacity-100"
    />
  );
}

export const profilePageShellClassName =
  'relative min-h-dvh overflow-hidden bg-background text-text-primary';

export const profileMainContainerClassName =
  'relative mx-auto w-full max-w-lg space-y-5 px-[max(1rem,env(safe-area-inset-left))] pt-4 pb-[calc(4.75rem+env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))] sm:max-w-xl lg:max-w-2xl lg:pb-10';

export const profileCardClassName =
  'rounded-[1.25rem] border border-white/10 bg-slate-900/55 shadow-[0_12px_32px_rgba(2,6,23,0.28)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70';
