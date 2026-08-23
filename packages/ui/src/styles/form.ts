/** Canonical form field styling — consumed by Quick Add, Timeline edit, and web forms. */

export const formLabelClass = 'block text-sm font-medium text-text-secondary';

export const formFieldClass =
  'h-11 w-full rounded-control border border-border-default bg-surface-subtle px-4 text-sm text-text-primary transition placeholder:text-text-tertiary hover:border-border-strong focus:border-interactive-primary focus:bg-surface focus:ring-2 focus:ring-focus-ring/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border-default aria-[invalid=true]:border-status-danger aria-[invalid=true]:focus:border-status-danger aria-[invalid=true]:focus:ring-status-danger/20';

export const formTextareaClass = `${formFieldClass} min-h-24 py-3`;

export const formHelperClass = 'mt-1.5 text-xs text-text-secondary';

export const formErrorClass = 'mt-1.5 text-xs text-status-danger';
