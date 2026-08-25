'use client';

import { Plus } from 'lucide-react';
import { forwardRef, useMemo } from 'react';

import type { TranslationKey } from '@diabetes-universe/i18n';
import {
  TIMELINE_MOBILE_QUICK_ADD_FAB_BUTTON_CLASSNAME,
  timelineMobileQuickAddFabPositionClassName,
  TIMELINE_MOBILE_QUICK_ADD_FAB_ICON_SIZE,
} from '../dashboard/dashboard-mobile-nav-layout';
import { useLocalization } from '../../lib/platform/react/use-localization';

export interface TimelineMobileQuickAddFabProps {
  readonly disabled?: boolean;
  readonly onClick?: () => void;
}

export const TimelineMobileQuickAddFab = forwardRef<
  HTMLButtonElement,
  TimelineMobileQuickAddFabProps
>(function TimelineMobileQuickAddFab({ disabled = false, onClick }, ref) {
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
      className={`${timelineMobileQuickAddFabPositionClassName} ${TIMELINE_MOBILE_QUICK_ADD_FAB_BUTTON_CLASSNAME}`}
      disabled={disabled}
      id="timeline-mobile-quick-add-fab"
      onClick={onClick}
      ref={ref}
      type="button"
    >
      <Plus
        aria-hidden="true"
        size={TIMELINE_MOBILE_QUICK_ADD_FAB_ICON_SIZE}
        strokeWidth={2.4}
      />
    </button>
  );
});
