'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { useMemo, type RefObject } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveDashboardNextActionLabels } from './dashboard-next-action-labels';
import {
  createDashboardNextActionViewModel,
  type DashboardNextActionProps,
} from './dashboard-next-action-model';

const titleId = 'dashboard-next-action-title';

export function DashboardNextAction({
  actionButtonRef,
  ...props
}: DashboardNextActionProps & {
  readonly actionButtonRef?: RefObject<HTMLButtonElement | null>;
}) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveDashboardNextActionLabels(localization),
    [localization],
  );
  const viewModel = createDashboardNextActionViewModel(props, labels);
  const isError = viewModel.state === 'error';

  if (viewModel.state === 'empty' && !viewModel.description) {
    return null;
  }

  return (
    <section
      aria-busy={viewModel.isLoading}
      aria-labelledby={titleId}
      className="relative col-span-full"
    >
      {viewModel.state === 'loading' ? (
        <>
          <span className="sr-only" id={titleId} role="status">
            {viewModel.statusLabel}
          </span>
          <div
            aria-hidden="true"
            className="h-11 animate-pulse rounded-2xl bg-white/60 motion-reduce:animate-none dark:bg-slate-800"
          />
        </>
      ) : null}

      {viewModel.state === 'ready' ? (
        <div
          className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-sm sm:gap-3 sm:px-4 ${
            isError
              ? 'border-status-danger/30 bg-white/70'
              : 'border-violet-100/70 bg-white/55 dark:border-violet-400/10 dark:bg-slate-900/50'
          }`}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-violet-500/12 text-violet-600 dark:text-violet-300">
            <Sparkles aria-hidden="true" size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
              {viewModel.title}
            </p>
            <h2
              className="truncate text-sm font-semibold text-[#1e3a5f] dark:text-white"
              id={titleId}
            >
              {viewModel.description}
            </h2>
          </div>
          <button
            className="focus-visible:outline-interactive-primary inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-violet-200/80 bg-white/80 px-3 text-xs font-bold text-violet-700 transition hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-400/20 dark:bg-slate-900/60 dark:text-violet-200"
            disabled={viewModel.actionDisabled}
            onClick={viewModel.onAction}
            ref={actionButtonRef}
            type="button"
          >
            <span>{viewModel.actionLabel}</span>
            <ArrowRight aria-hidden="true" size={14} />
          </button>
        </div>
      ) : null}

      {viewModel.state === 'empty' || viewModel.state === 'error' ? (
        <div
          aria-live={isError ? 'assertive' : 'polite'}
          className="rounded-2xl border border-white/70 bg-white/55 px-3 py-2.5 dark:border-white/10 dark:bg-slate-900/50"
          role={isError ? 'alert' : 'status'}
        >
          <h2 className="text-sm font-semibold text-[#1e3a5f]" id={titleId}>
            {viewModel.title}
          </h2>
          {viewModel.description ? (
            <p
              className={`mt-1 text-sm ${
                isError ? 'text-status-danger' : 'text-text-secondary'
              }`}
            >
              {viewModel.description}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
