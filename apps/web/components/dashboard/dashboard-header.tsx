'use client';

import { Button } from '@diabetes-universe/ui';
import { Plus, UserRound } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState, type ReactNode, type RefObject } from 'react';

import { BrandSymbol } from '../brand/brand-symbol';

import { useFormatter } from '../../lib/platform/react/use-formatter';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { usePresentationContext } from '../../lib/platform/react/use-presentation-context';
import { getTimelineCalendarDateKey } from '../../lib/timeline/timeline-date-time';
import {
  createDashboardHeaderDate,
  createDashboardHeaderViewModel,
  getDashboardAvatarImageUrl,
  type DashboardHeaderModelInput,
} from './dashboard-header-model';
import { resolveDashboardHeaderLabels } from './dashboard-header-labels';

const avatarTargetClassName =
  'grid size-11 shrink-0 place-items-center overflow-hidden rounded-full';
const desktopActionClassName =
  'hidden min-h-11 items-center justify-center gap-2 lg:inline-flex';

export interface DashboardHeaderProps extends Omit<
  DashboardHeaderModelInput,
  'date' | 'labels'
> {
  readonly addEventButtonRef?: RefObject<HTMLButtonElement | null>;
  readonly referenceTime?: Date;
}

function DashboardAvatar({
  avatarInitials,
  avatarLabel,
  avatarUrl,
  isLoading,
  onAvatarClick,
}: {
  readonly avatarInitials: string | null;
  readonly avatarLabel: string;
  readonly avatarUrl: string | null;
  readonly isLoading: boolean;
  readonly onAvatarClick?: () => void;
}) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const visibleAvatarUrl = getDashboardAvatarImageUrl(
    avatarUrl,
    failedAvatarUrl,
  );
  const avatarClassName = `${avatarTargetClassName} border border-border-default bg-slate-100 text-sm font-bold text-text-primary`;

  if (isLoading) {
    return (
      <span
        aria-hidden="true"
        className={`${avatarClassName} animate-pulse motion-reduce:animate-none`}
      />
    );
  }

  let content: ReactNode;

  if (visibleAvatarUrl) {
    content = (
      <Image
        alt={avatarLabel}
        className="size-full object-cover"
        height={44}
        onError={() => setFailedAvatarUrl(visibleAvatarUrl)}
        sizes="44px"
        src={visibleAvatarUrl}
        unoptimized
        width={44}
      />
    );
  } else if (avatarInitials) {
    content = <span aria-hidden="true">{avatarInitials}</span>;
  } else {
    content = <UserRound aria-hidden="true" size={20} />;
  }

  if (onAvatarClick) {
    return (
      <button
        aria-label={avatarLabel}
        className={`${avatarClassName} hover:border-border-strong focus-visible:outline-interactive-primary transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2`}
        onClick={onAvatarClick}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <span aria-label={avatarLabel} className={avatarClassName} role="img">
      {content}
    </span>
  );
}

export function DashboardHeader({
  addEventButtonRef,
  referenceTime,
  ...props
}: DashboardHeaderProps) {
  const localization = useLocalization();
  const formatter = useFormatter();
  const { locale, timeZone } = usePresentationContext();
  const resolvedReferenceTime = useMemo(
    () => referenceTime ?? new Date(),
    [referenceTime],
  );
  const labels = useMemo(
    () => resolveDashboardHeaderLabels(localization),
    [localization],
  );
  const headerDate = useMemo(
    () =>
      createDashboardHeaderDate({
        currentDate: resolvedReferenceTime,
        formatCalendarDateKey: (date) =>
          getTimelineCalendarDateKey(date.toISOString(), timeZone),
        formatDisplayDate: (date) =>
          formatter.formatDate(date, { dateStyle: 'full' }),
        locale,
        timeZone,
      }),
    [formatter, locale, resolvedReferenceTime, timeZone],
  );
  const viewModel = createDashboardHeaderViewModel({
    ...props,
    date: headerDate,
    labels,
  });
  const dateContent = viewModel.dateLabel ?? viewModel.dateUnavailableLabel;

  return (
    <header
      aria-busy={viewModel.isLoading}
      className="border-border-default bg-surface/95 text-text-primary sticky top-0 z-30 border-b pt-[env(safe-area-inset-top)] backdrop-blur"
    >
      <div className="mx-auto grid min-h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] lg:min-h-[4.5rem]">
        <div className="flex min-w-0 items-center gap-3">
          <BrandSymbol />
          <h1 className="truncate text-base font-bold sm:text-lg">
            {viewModel.productName}
          </h1>
        </div>

        {viewModel.isLoading ? (
          <span
            aria-hidden="true"
            className="col-span-2 row-start-2 h-5 w-48 max-w-full animate-pulse rounded bg-slate-200 motion-reduce:animate-none sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:justify-self-center"
          />
        ) : viewModel.dateLabel && viewModel.dateTime ? (
          <time
            aria-label={viewModel.currentDateAriaLabel ?? undefined}
            className="text-text-secondary col-span-2 row-start-2 min-w-0 text-sm font-medium sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:justify-self-center sm:text-center"
            dateTime={viewModel.dateTime}
          >
            {viewModel.dateLabel}
          </time>
        ) : (
          <span
            className="text-text-secondary col-span-2 row-start-2 min-w-0 text-sm sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:justify-self-center sm:text-center"
            role="status"
          >
            {dateContent}
          </span>
        )}

        <div className="col-start-2 row-start-1 flex items-center gap-2 sm:col-start-3">
          <Button
            aria-label={viewModel.addEventLabel}
            className={`${desktopActionClassName}`}
            disabled={viewModel.addEventDisabled}
            onClick={viewModel.onAddEvent}
            ref={addEventButtonRef}
            type="button"
          >
            <Plus aria-hidden="true" size={18} />
            <span>{viewModel.addEventLabel}</span>
          </Button>

          <DashboardAvatar
            avatarInitials={viewModel.avatarInitials}
            avatarLabel={viewModel.avatarLabel}
            avatarUrl={viewModel.avatarUrl}
            isLoading={viewModel.isLoading}
            onAvatarClick={viewModel.onAvatarClick}
          />
        </div>

        {viewModel.isLoading ? (
          <span className="sr-only" role="status">
            {viewModel.loadingLabel}
          </span>
        ) : null}

        {viewModel.isError ? (
          <p
            className="col-span-full m-0 text-xs font-medium text-rose-700"
            role="status"
          >
            {viewModel.errorMessage}
          </p>
        ) : null}
      </div>
    </header>
  );
}
