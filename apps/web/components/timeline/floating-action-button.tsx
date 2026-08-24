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
      className={`focus-visible:outline-interactive-primary fixed z-40 grid size-12 place-items-center rounded-full bg-gradient-to-br from-teal-400 via-cyan-400 to-blue-500 text-white shadow-[0_16px_40px_rgba(6,182,212,0.38)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 ${className}`}
      onClick={onClick}
      ref={ref}
      type="button"
    >
      <Plus aria-hidden="true" size={24} strokeWidth={2.25} />
    </button>
  );
});
