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
      className="relative z-30 pt-[env(safe-area-inset-top)]"
    >
      <div className="mx-auto grid min-h-20 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-4 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] lg:min-h-24 lg:py-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 via-cyan-400 to-blue-500 shadow-[0_12px_28px_rgba(14,165,233,0.24)] [&_svg]:drop-shadow-sm">
            <BrandSymbol />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl lg:text-2xl dark:text-white">
              {viewModel.brandName}
            </h1>
            <p className="sr-only">{viewModel.productName}</p>
            <p className="mt-0.5 hidden text-xs font-medium text-slate-500 sm:block dark:text-slate-400">
              {dateContent}
            </p>
          </div>
        </div>

        {viewModel.isLoading ? (
          <span
            aria-hidden="true"
            className="col-span-2 row-start-2 h-5 w-48 max-w-full animate-pulse rounded bg-white/70 motion-reduce:animate-none sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:justify-self-center dark:bg-slate-800"
          />
        ) : viewModel.dateLabel && viewModel.dateTime ? (
          <time
            aria-label={viewModel.currentDateAriaLabel ?? undefined}
            className="col-span-2 row-start-2 min-w-0 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:justify-self-center sm:text-center lg:text-sm dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
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
            className={`${desktopActionClassName} border-0 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white shadow-[0_10px_24px_rgba(6,182,212,0.22)] hover:brightness-105`}
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
            className="text-status-danger col-span-full m-0 text-xs font-medium"
            role="status"
          >
            {viewModel.errorMessage}
          </p>
        ) : null}
      </div>
    </header>
  );
}
