'use client';

import { EventCard } from '@diabetes-universe/ui';
import { Sparkles } from 'lucide-react';
import { useMemo } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { mapDashboardAiInsightToCard } from './dashboard-ai-insight-card.mapper';
import { resolveDashboardAiInsightLabels } from './dashboard-ai-insight-labels';
import {
  createDashboardAiInsightViewModel,
  type DashboardAiInsightProps,
} from './dashboard-ai-insight-model';

const titleId = 'dashboard-ai-insight-title';

export function DashboardAiInsight(props: DashboardAiInsightProps) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveDashboardAiInsightLabels(localization),
    [localization],
  );
  const viewModel = useMemo(
    () => createDashboardAiInsightViewModel(props, labels),
    [labels, props],
  );
  const isError = viewModel.state === 'error';

  return (
    <section
      aria-busy={viewModel.isLoading}
      aria-labelledby={titleId}
      className={`bg-surface col-span-full rounded-2xl border p-5 shadow-sm lg:col-span-4 ${
        isError ? 'border-status-danger/40' : 'border-border-default'
      }`}
    >
      {viewModel.state === 'loading' ? (
        <>
          <h2 className="sr-only" id={titleId}>
            {labels.title}
          </h2>
          <span className="sr-only" role="status">
            {viewModel.message}
          </span>
          <div aria-hidden="true" className="space-y-4">
            <div className="space-y-2">
              <div className="bg-surface-subtle h-4 w-36 animate-pulse rounded motion-reduce:animate-none" />
              <div className="bg-surface-subtle h-6 w-44 animate-pulse rounded motion-reduce:animate-none" />
            </div>
            <div className="rounded-control bg-surface-subtle h-28 animate-pulse motion-reduce:animate-none" />
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' && viewModel.insight ? (
        <>
          <div className="flex items-start gap-4">
            <div
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"
            >
              <Sparkles size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-text-secondary text-sm">{labels.eyebrow}</p>
              <h2
                className="text-text-primary mt-0.5 text-lg font-bold"
                id={titleId}
              >
                {labels.title}
              </h2>
              <p className="text-text-secondary mt-1 text-xs">
                {viewModel.insight.disclaimer}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <EventCard
              {...mapDashboardAiInsightToCard(viewModel.insight)}
              variant="standard"
            />
          </div>
        </>
      ) : null}

      {viewModel.state === 'empty' || viewModel.state === 'error' ? (
        <div
          aria-live={isError ? 'assertive' : 'polite'}
          className="flex items-start gap-4"
          role={isError ? 'alert' : 'status'}
        >
          <div
            aria-hidden="true"
            className={`grid size-11 shrink-0 place-items-center rounded-xl ${
              isError
                ? 'bg-status-danger/10 text-status-danger'
                : 'bg-teal-500/10 text-teal-700'
            }`}
          >
            <Sparkles size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-text-primary text-lg font-bold" id={titleId}>
              {labels.title}
            </h2>
            <p
              className={`mt-2 text-sm ${
                isError ? 'text-status-danger' : 'text-text-secondary'
              }`}
            >
              {viewModel.message}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
