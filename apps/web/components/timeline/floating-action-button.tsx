'use client';

import { Plus } from 'lucide-react';
import { forwardRef, useMemo } from 'react';

import type { TranslationKey } from '@diabetes-universe/i18n';
import { useLocalization } from '../../lib/platform/react/use-localization';

interface FloatingActionButtonProps {
  readonly className?: string;
  readonly onClick?: () => void;
}

export const FloatingActionButton = forwardRef<
  HTMLButtonElement,
  FloatingActionButtonProps
>(function FloatingActionButton({ className = '', onClick }, ref) {
  const localization = useLocalization();
  const label = useMemo(
    () =>
      localization.translate({
        key: 'quick-add.button.label' as TranslationKey,
      }).value,
    [localization],
  );

  return (
    <button
      aria-label={label}
      className={`bg-interactive-primary text-text-inverse hover:bg-interactive-primary-hover focus-visible:outline-interactive-primary fixed z-40 grid size-12 place-items-center rounded-full shadow-md shadow-black/15 transition focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 ${className}`}
      onClick={onClick}
      ref={ref}
      type="button"
    >
      <Plus aria-hidden="true" size={24} strokeWidth={2.25} />
    </button>
  );
});
