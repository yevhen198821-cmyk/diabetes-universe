/**
 * Shared mobile bottom navigation layout tokens.
 *
 * Inner height matches DashboardMobileNav when showQuickAddFab=false:
 * ul py-1 + min-h-11 touch row + 10px label + inner border.
 * Outer inset matches nav pb-[max(0.5rem, env(safe-area-inset-bottom))].
 */
export const DASHBOARD_MOBILE_NAV_INNER_HEIGHT = '4.25rem';

export const DASHBOARD_MOBILE_NAV_CONTENT_GAP = '0.5rem';

export const dashboardMobileNavOuterClassName =
  'pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden';

export const dashboardMainMobileNavPaddingClassName =
  'pb-[calc(4.25rem+0.5rem+max(0.5rem,env(safe-area-inset-bottom)))] lg:pb-10';

/**
 * Timeline mobile Quick Add FAB sizing (showQuickAddFab=true only).
 * Compact 4rem (64px) target with ~25% lighter shadow/protrusion vs prior 3.75rem (60px) + -mt-6 treatment.
 */
export const DASHBOARD_MOBILE_QUICK_ADD_FAB_SIZE = '4rem';

export const DASHBOARD_MOBILE_QUICK_ADD_FAB_CLASSES =
  'focus-visible:outline-interactive-primary -mt-4 grid size-16 min-h-11 min-w-11 place-items-center rounded-full bg-gradient-to-br from-teal-400 via-cyan-400 to-blue-500 text-white shadow-[0_12px_30px_rgba(6,182,212,0.28)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export const DASHBOARD_MOBILE_QUICK_ADD_FAB_ICON_SIZE = 22;

export const dashboardMobileNavInnerClassName =
  'pointer-events-auto mx-auto max-w-md rounded-[1.65rem] border border-slate-200/55 bg-white/84 shadow-[0_6px_24px_rgba(15,23,42,0.07)] backdrop-blur-lg dark:border-white/8 dark:bg-slate-950/84 dark:shadow-[0_6px_24px_rgba(0,0,0,0.32)]';
