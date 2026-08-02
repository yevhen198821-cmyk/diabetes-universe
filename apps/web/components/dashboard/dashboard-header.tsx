'use client';

import { Button } from '@diabetes-universe/ui';
import { Plus, UserRound } from 'lucide-react';
import Image from 'next/image';
import { useState, type ReactNode } from 'react';

import {
  DASHBOARD_AVATAR_TARGET_CLASS_NAME,
  DASHBOARD_DESKTOP_ACTION_CLASS_NAME,
  createDashboardHeaderViewModel,
  type DashboardHeaderModelInput,
} from './dashboard-header-model';

export type DashboardHeaderProps = DashboardHeaderModelInput;

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
  const showAvatarImage = avatarUrl !== null && avatarUrl !== failedAvatarUrl;
  const avatarClassName = `${DASHBOARD_AVATAR_TARGET_CLASS_NAME} border border-slate-200 bg-slate-100 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100`;

  if (isLoading) {
    return (
      <span
        aria-hidden="true"
        className={`${avatarClassName} animate-pulse motion-reduce:animate-none`}
      />
    );
  }

  let content: ReactNode;

  if (showAvatarImage) {
    content = (
      <Image
        alt=""
        className="size-full object-cover"
        height={44}
        onError={() => setFailedAvatarUrl(avatarUrl)}
        sizes="44px"
        src={avatarUrl}
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
        className={`${avatarClassName} transition hover:border-slate-300 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:outline-teal-400`}
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

export function DashboardHeader(props: DashboardHeaderProps) {
  const viewModel = createDashboardHeaderViewModel(props);
  const dateContent = viewModel.dateLabel ?? viewModel.dateUnavailableLabel;

  return (
    <header
      aria-busy={viewModel.isLoading}
      className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] text-slate-950 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-50"
    >
      <div className="mx-auto grid min-h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-6 lg:min-h-[4.5rem]">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-700 text-sm font-bold text-white dark:bg-teal-500 dark:text-slate-950"
          >
            DU
          </span>
          <h1 className="truncate text-base font-bold sm:text-lg">
            {viewModel.productName}
          </h1>
        </div>

        {viewModel.isLoading ? (
          <span
            aria-hidden="true"
            className="col-span-2 row-start-2 h-5 w-48 max-w-full animate-pulse rounded bg-slate-200 motion-reduce:animate-none sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:justify-self-center dark:bg-slate-700"
          />
        ) : viewModel.dateLabel && viewModel.dateTime ? (
          <time
            aria-label={`${viewModel.currentDateLabel}: ${viewModel.dateLabel}`}
            className="col-span-2 row-start-2 min-w-0 text-sm font-medium text-slate-600 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:justify-self-center sm:text-center dark:text-slate-300"
            dateTime={viewModel.dateTime}
          >
            {viewModel.dateLabel}
          </time>
        ) : (
          <span
            className="col-span-2 row-start-2 min-w-0 text-sm text-slate-500 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:justify-self-center sm:text-center dark:text-slate-400"
            role="status"
          >
            {dateContent}
          </span>
        )}

        <div className="col-start-2 row-start-1 flex items-center gap-2 sm:col-start-3">
          <Button
            aria-label={viewModel.addEventLabel}
            className={`${DASHBOARD_DESKTOP_ACTION_CLASS_NAME} dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400 dark:focus-visible:outline-teal-400`}
            onClick={viewModel.onAddEvent}
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
            className="col-span-full m-0 text-xs font-medium text-rose-700 dark:text-rose-300"
            role="status"
          >
            {viewModel.errorMessage}
          </p>
        ) : null}
      </div>
    </header>
  );
}
