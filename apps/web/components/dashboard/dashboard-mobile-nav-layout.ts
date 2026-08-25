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

export const dashboardMobileNavInnerClassName =
  'pointer-events-auto mx-auto max-w-md rounded-[1.65rem] border border-slate-200/55 bg-white/84 shadow-[0_6px_24px_rgba(15,23,42,0.07)] backdrop-blur-lg dark:border-white/8 dark:bg-slate-950/84 dark:shadow-[0_6px_24px_rgba(0,0,0,0.32)]';
