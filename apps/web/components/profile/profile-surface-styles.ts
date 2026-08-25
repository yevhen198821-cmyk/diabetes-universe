export const profilePageShellClassName =
  'relative min-h-dvh overflow-hidden bg-background text-text-primary';

export const profileMainContainerClassName =
  'relative mx-auto w-full max-w-lg space-y-5 px-[max(1rem,env(safe-area-inset-left))] pt-4 pb-[calc(4.75rem+env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))] sm:max-w-xl lg:max-w-2xl lg:pb-10';

export const profilePageBackgroundClassName =
  'pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(45,212,191,0.14),transparent_34%),radial-gradient(circle_at_92%_8%,rgba(125,211,252,0.16),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.08),transparent_40%)] dark:bg-[radial-gradient(circle_at_10%_0%,rgba(45,212,191,0.10),transparent_34%),radial-gradient(circle_at_92%_8%,rgba(167,139,250,0.12),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.08),transparent_40%)]';

export const profileCardClassName =
  'rounded-[1.25rem] border border-border-default bg-surface shadow-elevation-md dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_12px_32px_rgba(2,6,23,0.28)] dark:backdrop-blur-md';

export const profileInsetSurfaceClassName =
  'rounded-[1.15rem] border border-border-default bg-surface-subtle dark:border-white/8 dark:bg-slate-950/30';

export const profileDisabledRowClassName =
  'flex min-h-[4.75rem] items-center gap-3 rounded-[1.15rem] border border-border-subtle bg-surface px-4 py-3 dark:border-white/6 dark:bg-slate-950/25';

export const profileSectionHeadingClassName =
  'px-1 text-[11px] font-bold tracking-[0.14em] text-text-tertiary uppercase';

export const profileComingSoonBadgeClassName =
  'rounded-full border border-border-default bg-surface-subtle px-2 py-0.5 text-[10px] font-semibold tracking-wide text-text-secondary uppercase dark:border-white/8 dark:bg-white/8 dark:text-slate-400';

export const profileAboutExpandedDividerClassName =
  'mt-3 border-t border-border-subtle pt-3 pl-[3.25rem] text-sm text-text-secondary dark:border-white/8 dark:text-slate-300';

export const profileInteractiveLinkClassName =
  'focus-visible:outline-interactive-primary flex min-h-[4.75rem] items-center justify-between gap-3 rounded-[1.15rem] border border-border-default bg-surface-subtle px-4 py-3 transition hover:border-border-strong hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/10 dark:bg-slate-950/30 dark:hover:border-white/15 dark:hover:bg-slate-950/40';

export const profileLogoutButtonClassName =
  'focus-visible:outline-interactive-primary min-h-11 w-full rounded-[1rem] border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-800 transition hover:border-rose-300 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100 dark:hover:bg-rose-500/15';

export const profileThemeControlActiveClassName =
  'border-teal-300 bg-teal-50 text-teal-900 ring-1 ring-teal-200 dark:border-teal-400/40 dark:bg-teal-400/15 dark:text-teal-100 dark:ring-teal-300/25';

export const profileThemeControlInactiveClassName =
  'border-border-default bg-surface text-text-secondary hover:border-border-strong hover:bg-surface-subtle dark:border-white/10 dark:bg-slate-950/30 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/5';

export const profileUserCardClassName =
  'profile-card relative overflow-hidden rounded-[1.5rem] border border-border-default bg-surface p-5 shadow-elevation-md dark:border-white/10 dark:bg-slate-900/75 dark:shadow-[0_18px_40px_rgba(2,6,23,0.35)] dark:backdrop-blur-md';

export const profileUserCardAccentClassName =
  'pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(45,212,191,0.10),transparent_42%),radial-gradient(circle_at_100%_0%,rgba(125,211,252,0.12),transparent_38%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(45,212,191,0.12),transparent_42%),radial-gradient(circle_at_100%_0%,rgba(167,139,250,0.14),transparent_38%)]';

export type ProfileMenuIconTone =
  'amber' | 'blue' | 'coral' | 'neutral' | 'teal' | 'violet';

export const PROFILE_ICON_TONE_CLASS: Readonly<
  Record<ProfileMenuIconTone, string>
> = {
  amber:
    'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-400/15 dark:text-amber-100 dark:ring-amber-300/25',
  blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-400/15 dark:text-blue-100 dark:ring-blue-300/25',
  coral:
    'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-400/15 dark:text-rose-100 dark:ring-rose-300/25',
  neutral:
    'bg-surface-subtle text-text-secondary ring-1 ring-border-default dark:bg-slate-400/10 dark:text-slate-100 dark:ring-slate-300/15',
  teal: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200 dark:bg-teal-400/15 dark:text-teal-100 dark:ring-teal-300/25',
  violet:
    'bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-400/15 dark:text-violet-100 dark:ring-violet-300/25',
};

export const profileSettingsThemeIconClassName = PROFILE_ICON_TONE_CLASS.teal;
