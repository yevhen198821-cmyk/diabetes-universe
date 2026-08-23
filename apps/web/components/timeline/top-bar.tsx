'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { BrandSymbol } from '../brand/brand-symbol';
import { resolveTimelineUiLabels } from './timeline-ui-labels';
import { iconButton } from './ui-styles';

export function TopBar() {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveTimelineUiLabels(localization),
    [localization],
  );

  return (
    <header className="border-border-default bg-surface/95 sticky top-0 z-30 border-b px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <Link
          aria-label={labels.topBar.home}
          className={`${iconButton} shrink-0`}
          href="/"
        >
          <ArrowLeft aria-hidden="true" size={18} />
        </Link>

        <BrandSymbol size="sm" />

        <p className="text-section-title sm:text-xl">{labels.header.title}</p>
      </div>
    </header>
  );
}
