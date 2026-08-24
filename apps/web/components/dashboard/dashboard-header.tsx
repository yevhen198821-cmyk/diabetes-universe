'use client';

import { UserRound } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState, type ReactNode } from 'react';

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
import { DashboardBrandWordmark } from './dashboard-brand-wordmark';

const avatarTargetClassName =
  'grid size-11 shrink-0 place-items-center overflow-hidden rounded-full';

const brandLogoPath = '/brand/diabetes-universe-logo.png';
const brandLogoWidth = 1254;
const brandLogoHeight = 1254;
const brandLogoIconClassName =
  'h-[3.75rem] w-[3.75rem] shrink-0 object-contain sm:h-[4.375rem] sm:w-[4.375rem] lg:h-20 lg:w-20';

export interface DashboardHeaderProps extends Omit<
  DashboardHeaderModelInput,
  'addEventDisabled' | 'date' | 'labels' | 'onAddEvent'
> {
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
  const avatarClassName = `${avatarTargetClassName} border border-white/80 bg-white/85 text-sm font-bold text-text-primary shadow-[0_8px_24px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:border-white/10 dark:bg-slate-900/85 dark:ring-white/10`;

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
        className={`${avatarClassName} focus-visible:outline-interactive-primary transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2`}
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
    addEventDisabled: false,
    date: headerDate,
    labels,
    onAddEvent: () => {},
  });

  return (
    <header
      aria-busy={viewModel.isLoading}
      className="relative z-30 pt-[env(safe-area-inset-top)]"
    >
      <div className="mx-auto flex min-h-[4.25rem] max-w-6xl items-center justify-between gap-3 py-3 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] sm:min-h-20 sm:py-4 sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] lg:min-h-24 lg:py-5">
        <div className="flex min-w-0 flex-1 items-center">
          <h1 className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Image
              alt=""
              aria-hidden
              className={brandLogoIconClassName}
              height={brandLogoHeight}
              priority
              src={brandLogoPath}
              unoptimized
              width={brandLogoWidth}
            />
            <span className="min-w-0 shrink">
              <DashboardBrandWordmark
                accentLine={viewModel.brandLineAccent}
                primaryLine={viewModel.brandLinePrimary}
              />
            </span>
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {viewModel.isLoading ? (
            <span
              aria-hidden="true"
              className="hidden h-5 w-40 animate-pulse rounded bg-white/70 motion-reduce:animate-none lg:block dark:bg-slate-800"
            />
          ) : viewModel.dateLabel && viewModel.dateTime ? (
            <time
              aria-label={viewModel.currentDateAriaLabel ?? undefined}
              className="hidden min-w-0 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur lg:inline-flex dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
              dateTime={viewModel.dateTime}
            >
              {viewModel.dateLabel}
            </time>
          ) : null}

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
            className="text-status-danger absolute inset-x-4 bottom-1 m-0 text-xs font-medium"
            role="status"
          >
            {viewModel.errorMessage}
          </p>
        ) : null}
      </div>
    </header>
  );
}
