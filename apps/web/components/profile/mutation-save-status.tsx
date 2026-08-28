'use client';

export type MutationSaveState = 'idle' | 'saving' | 'saved' | 'error';

interface MutationSaveStatusProps {
  readonly errorMessage?: string | null;
  readonly savedLabel: string;
  readonly savingLabel: string;
  readonly state: MutationSaveState;
}

export function MutationSaveStatus({
  errorMessage,
  savedLabel,
  savingLabel,
  state,
}: MutationSaveStatusProps) {
  if (state === 'idle') {
    return null;
  }

  if (state === 'saving') {
    return (
      <p
        aria-live="polite"
        className="text-text-secondary text-xs"
        role="status"
      >
        {savingLabel}
      </p>
    );
  }

  if (state === 'saved') {
    return (
      <p
        aria-live="polite"
        className="text-xs text-teal-700 dark:text-teal-300"
        role="status"
      >
        {savedLabel}
      </p>
    );
  }

  return (
    <p
      aria-live="assertive"
      className="text-sm text-rose-700 dark:text-rose-300"
      role="alert"
    >
      {errorMessage}
    </p>
  );
}
