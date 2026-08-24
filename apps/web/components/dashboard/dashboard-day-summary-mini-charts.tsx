'use client';

import type { ReactNode } from 'react';

export interface DashboardDaySummaryMiniChartProps {
  readonly ariaLabel: string;
  readonly emptyHint?: string;
}

const CHART_WIDTH = 96;
const CHART_HEIGHT = 36;

function MiniChartFrame({
  ariaLabel,
  children,
}: {
  readonly ariaLabel: string;
  readonly children: ReactNode;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="relative z-10 mt-1.5 h-9 w-full max-w-[6.5rem]"
      role="img"
    >
      {children}
    </div>
  );
}

function EmptyMiniChart({
  ariaLabel,
  emptyHint,
  toneClassName,
}: DashboardDaySummaryMiniChartProps & {
  readonly toneClassName: string;
}) {
  return (
    <div className="relative z-10 mt-1.5 flex h-9 w-full max-w-[6.5rem] flex-col justify-end">
      <span className="sr-only">{ariaLabel}</span>
      <div aria-hidden="true" className="flex flex-col justify-end gap-1">
        <svg
          className={`h-[1.125rem] w-full ${toneClassName}`}
          viewBox={`0 0 ${CHART_WIDTH} 16`}
        >
          <rect
            fill="currentColor"
            height="5"
            opacity="0.08"
            rx="2.5"
            width={CHART_WIDTH - 16}
            x="8"
            y="3"
          />
          <line
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1"
            x1="8"
            x2={CHART_WIDTH - 8}
            y1="13"
            y2="13"
          />
        </svg>
        {emptyHint ? (
          <span className="truncate text-[9px] leading-none font-medium opacity-80">
            {emptyHint}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function buildSparklinePath(values: readonly number[]): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerHeight = CHART_HEIGHT - 8;
  const innerWidth = CHART_WIDTH - 8;

  return values
    .map((value, index) => {
      const x = 4 + (index / (values.length - 1)) * innerWidth;
      const y = 4 + innerHeight - ((value - min) / range) * innerHeight;

      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export function GlucoseMiniChart({
  ariaLabel,
  emptyHint,
  values,
}: DashboardDaySummaryMiniChartProps & {
  readonly values: readonly number[];
}) {
  if (values.length === 0) {
    return (
      <EmptyMiniChart
        ariaLabel={ariaLabel}
        emptyHint={emptyHint}
        toneClassName="text-teal-500/45 dark:text-teal-400/35"
      />
    );
  }

  if (values.length === 1) {
    return (
      <MiniChartFrame ariaLabel={ariaLabel}>
        <svg
          aria-hidden="true"
          className="h-full w-full text-teal-500/80"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        >
          <circle
            cx={CHART_WIDTH / 2}
            cy={CHART_HEIGHT / 2}
            fill="currentColor"
            r="4"
          />
        </svg>
      </MiniChartFrame>
    );
  }

  return (
    <MiniChartFrame ariaLabel={ariaLabel}>
      <svg
        aria-hidden="true"
        className="h-full w-full text-teal-500/85"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      >
        <path
          d={buildSparklinePath(values)}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.25"
        />
      </svg>
    </MiniChartFrame>
  );
}

function BarMiniChart({
  ariaLabel,
  barClassName,
  emptyHint,
  emptyToneClassName,
  values,
}: DashboardDaySummaryMiniChartProps & {
  readonly barClassName: string;
  readonly emptyToneClassName: string;
  readonly values: readonly number[];
}) {
  if (values.length === 0) {
    return (
      <EmptyMiniChart
        ariaLabel={ariaLabel}
        emptyHint={emptyHint}
        toneClassName={emptyToneClassName}
      />
    );
  }

  const maxValue = Math.max(...values, 1);
  const barWidth = Math.min(
    10,
    Math.max(4, (CHART_WIDTH - 8) / values.length - 3),
  );
  const gap = values.length > 1 ? 3 : 0;
  const totalWidth = values.length * barWidth + (values.length - 1) * gap;
  const startX = (CHART_WIDTH - totalWidth) / 2;

  return (
    <MiniChartFrame ariaLabel={ariaLabel}>
      <svg
        aria-hidden="true"
        className="h-full w-full"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      >
        {values.map((value, index) => {
          const height = Math.max(4, ((CHART_HEIGHT - 8) * value) / maxValue);
          const x = startX + index * (barWidth + gap);
          const y = CHART_HEIGHT - 4 - height;

          return (
            <rect
              className={barClassName}
              height={height}
              key={index}
              rx={barWidth / 2}
              width={barWidth}
              x={x}
              y={y}
            />
          );
        })}
      </svg>
    </MiniChartFrame>
  );
}

export function InsulinMiniChart(
  props: DashboardDaySummaryMiniChartProps & {
    readonly values: readonly number[];
  },
) {
  return (
    <BarMiniChart
      {...props}
      barClassName="fill-violet-500/75"
      emptyToneClassName="text-violet-500/45 dark:text-violet-400/35"
      values={props.values}
    />
  );
}

export function NutritionMiniChart(
  props: DashboardDaySummaryMiniChartProps & {
    readonly values: readonly number[];
  },
) {
  return (
    <BarMiniChart
      {...props}
      barClassName="fill-orange-500/75"
      emptyToneClassName="text-orange-500/45 dark:text-orange-400/35"
      values={props.values}
    />
  );
}

export function ActivityMiniChart(
  props: DashboardDaySummaryMiniChartProps & {
    readonly values: readonly number[];
  },
) {
  return (
    <BarMiniChart
      {...props}
      barClassName="fill-blue-500/75"
      emptyToneClassName="text-blue-500/45 dark:text-blue-400/35"
      values={props.values}
    />
  );
}
