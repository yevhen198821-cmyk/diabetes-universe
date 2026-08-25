/**
 * Shared mobile bottom navigation layout tokens.
 *
 * Inner height matches DashboardMobileNav:
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

/**
 * Timeline mobile Quick Add FAB — detached from bottom nav.
 * Sits on the right, 25% of nav inner height above the nav panel top edge.
 */
export const TIMELINE_MOBILE_QUICK_ADD_FAB_SIZE = '3rem';

export const TIMELINE_MOBILE_QUICK_ADD_FAB_ICON_SIZE = 20;

/** Effective rendered mobile nav bar height (ul row + labels). */
export const DASHBOARD_MOBILE_NAV_BAR_HEIGHT = '3.75rem';

/** 25% lift above the nav panel top edge. */
export const TIMELINE_MOBILE_QUICK_ADD_FAB_LIFT = '0.9375rem';

export const timelineMobileQuickAddFabBottomOffsetClassName =
  'bottom-[calc(max(0.5rem,env(safe-area-inset-bottom))+3.75rem+0.9375rem)]';

export const timelineMobileQuickAddFabPositionClassName = `pointer-events-auto fixed z-40 lg:hidden right-[max(1rem,env(safe-area-inset-right))] ${timelineMobileQuickAddFabBottomOffsetClassName}`;

export const TIMELINE_MOBILE_QUICK_ADD_FAB_BUTTON_CLASSNAME =
  'focus-visible:outline-interactive-primary grid size-12 min-h-11 min-w-11 place-items-center rounded-full bg-gradient-to-br from-teal-400 via-cyan-400 to-blue-500 text-white shadow-[0_10px_24px_rgba(6,182,212,0.24)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
