/** Shared interaction surface classes for links styled as icon buttons. */

export const iconButtonClass =
  'grid size-10 shrink-0 place-items-center rounded-control border border-border-default bg-surface text-text-secondary transition hover:border-border-strong hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-interactive-primary';

export const filterChipSelectedClass =
  'border-interactive-primary bg-interactive-primary text-text-inverse';

export const filterChipDefaultClass =
  'border-border-default bg-surface text-text-primary hover:border-border-strong hover:bg-surface-subtle';

export const overlayScrimClass =
  'absolute inset-0 bg-overlay backdrop-blur-[1px]';

export const dialogPanelClass =
  'relative z-10 flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom)))] w-full max-w-2xl flex-col overflow-hidden rounded-t-modal border border-border-default bg-surface shadow-elevation-md outline-none sm:rounded-modal';
