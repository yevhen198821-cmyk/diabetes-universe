export const appPageShellClassName =
  'text-text-primary dark:bg-background relative min-h-screen overflow-hidden bg-[#f7fafd]';

export function AppPageBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_8%_6%,rgba(45,212,191,0.15),transparent_30%),radial-gradient(circle_at_94%_4%,rgba(251,146,60,0.15),transparent_32%),radial-gradient(circle_at_74%_16%,rgba(167,139,250,0.12),transparent_30%),radial-gradient(circle_at_24%_20%,rgba(244,114,182,0.09),transparent_26%)] dark:opacity-45"
    />
  );
}

export const frostedPanelClassName =
  'rounded-[1.5rem] border border-white/80 bg-white/75 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/75';
