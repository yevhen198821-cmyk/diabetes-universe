import { EventCard } from '@diabetes-universe/ui';
import { Sparkles } from 'lucide-react';

import { mapDashboardAiInsightToCard } from './dashboard-ai-insight-card.mapper';
import {
  createDashboardAiInsightViewModel,
  dashboardAiInsightLabels,
  type DashboardAiInsightProps,
} from './dashboard-ai-insight-model';

const titleId = 'dashboard-ai-insight-title';

export function DashboardAiInsight(props: DashboardAiInsightProps) {
  const viewModel = createDashboardAiInsightViewModel(props);
  const isError = viewModel.state === 'error';

  return (
    <section
      aria-busy={viewModel.isLoading}
      aria-labelledby={titleId}
      className={`col-span-full rounded-2xl border bg-white p-5 shadow-sm lg:col-span-4 dark:bg-slate-900 ${
        isError
          ? 'border-rose-200 dark:border-rose-900/70'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {viewModel.state === 'loading' ? (
        <>
          <h2 className="sr-only" id={titleId}>
            {dashboardAiInsightLabels.title}
          </h2>
          <span className="sr-only" role="status">
            {viewModel.message}
          </span>
          <div aria-hidden="true" className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-36 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
              <div className="h-6 w-44 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
            </div>
            <div className="h-28 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' && viewModel.insight ? (
        <>
          <div className="flex items-start gap-4">
            <div
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300"
            >
              <Sparkles size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {dashboardAiInsightLabels.eyebrow}
              </p>
              <h2
                className="mt-0.5 text-lg font-bold text-slate-950 dark:text-slate-50"
                id={titleId}
              >
                {dashboardAiInsightLabels.title}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-300'
                : 'bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300'
            }`}
          >
            <Sparkles size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              className="text-lg font-bold text-slate-950 dark:text-slate-50"
              id={titleId}
            >
              {dashboardAiInsightLabels.title}
            </h2>
            <p
              className={`mt-2 text-sm ${
                isError
                  ? 'text-rose-700 dark:text-rose-300'
                  : 'text-slate-600 dark:text-slate-300'
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
