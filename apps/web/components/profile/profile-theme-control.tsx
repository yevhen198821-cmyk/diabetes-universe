'use client';

import type { ThemePreference } from '../../lib/theme/theme-config';
import { useThemePreference } from '../../lib/theme/theme-provider';

export interface ProfileThemeControlLabels {
  readonly dark: string;
  readonly light: string;
  readonly system: string;
  readonly title: string;
}

export function ProfileThemeControl({
  labels,
}: {
  readonly labels: ProfileThemeControlLabels;
}) {
  const { preference, setPreference } = useThemePreference();

  const options: ReadonlyArray<{
    readonly id: ThemePreference;
    readonly label: string;
  }> = [
    { id: 'light', label: labels.light },
    { id: 'dark', label: labels.dark },
    { id: 'system', label: labels.system },
  ];

  return (
    <div
      aria-label={labels.title}
      className="mt-3 grid grid-cols-3 gap-2"
      role="group"
    >
      {options.map((option) => {
        const isActive = preference === option.id;

        return (
          <button
            aria-pressed={isActive}
            className={`focus-visible:outline-interactive-primary min-h-11 rounded-xl border px-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-sm ${
              isActive
                ? 'border-amber-300/70 bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/40'
                : 'border-white/10 bg-slate-950/30 text-slate-300 hover:border-white/20 hover:bg-white/5'
            }`}
            key={option.id}
            onClick={() => setPreference(option.id)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
