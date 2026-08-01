import type { ReactNode } from 'react';

import { eventTypeAppearances } from '../../theme/event-type-appearance';
import type { EventCardProps, EventCardStatus } from './EventCard.types';

const statusLabels: Record<EventCardStatus, string> = {
  default: '',
  completed: 'Выполнено',
  scheduled: 'Запланировано',
  missed: 'Пропущено',
  error: 'Ошибка',
};

function EventIcon({
  accent,
  children,
  compact = false,
}: {
  readonly accent: string;
  readonly children: ReactNode;
  readonly compact?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-lg text-xs font-bold ${accent} ${
        compact
          ? 'absolute top-3 -left-10 size-8 border-4 border-slate-50 sm:-left-[2.875rem]'
          : 'size-9'
      }`}
    >
      {children}
    </span>
  );
}

export function EventCard({
  context,
  icon,
  onClick,
  status = 'default',
  subtitle,
  time,
  title,
  type,
  unit,
  value,
  variant = 'standard',
}: EventCardProps) {
  const { accent, fallbackIcon } = eventTypeAppearances[type];
  const statusLabel = statusLabels[status];
  const ariaLabel = [time, title, value, unit, context, statusLabel]
    .filter(Boolean)
    .join(', ');
  const isCompact = variant === 'compact';

  const compactContent = (
    <>
      <time
        className="text-sm font-medium text-slate-500 tabular-nums"
        dateTime={time}
      >
        {time}
      </time>

      <EventIcon accent={accent} compact>
        {icon ?? fallbackIcon}
      </EventIcon>

      <span className="min-w-0">
        <span className="block text-base font-bold text-slate-950 sm:text-lg">
          {value} {unit}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm text-slate-600">{title}</span>
          {context ? (
            <span className="text-xs text-slate-400">{context}</span>
          ) : null}
        </span>
      </span>
    </>
  );

  const standardContent = (
    <>
      <time
        className="w-12 shrink-0 text-sm font-medium text-slate-500 tabular-nums"
        dateTime={time}
      >
        {time}
      </time>

      <EventIcon accent={accent}>{icon ?? fallbackIcon}</EventIcon>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-700">
          {title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-xs text-slate-500">
            {subtitle}
          </span>
        ) : null}
        {context ? (
          <span className="mt-0.5 block truncate text-xs text-slate-400">
            {context}
          </span>
        ) : null}
      </span>

      <span className="shrink-0 text-right">
        <span className="block text-base font-bold text-slate-950">
          {value}{' '}
          <span className="text-sm font-semibold text-slate-600">{unit}</span>
        </span>
        {statusLabel ? (
          <span className="mt-0.5 block text-xs text-slate-500">
            {statusLabel}
          </span>
        ) : null}
      </span>
    </>
  );

  const className = `w-full items-center gap-3 rounded-xl border border-slate-200 bg-white text-left shadow-sm transition ${
    isCompact
      ? 'relative grid min-h-14 grid-cols-[3rem_minmax(0,1fr)] px-3 py-2.5'
      : 'flex min-h-16 px-4 py-3'
  }`;
  const content = isCompact ? compactContent : standardContent;

  if (onClick) {
    return (
      <button
        aria-label={ariaLabel}
        className={`${className} cursor-pointer hover:border-slate-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700`}
        onClick={onClick}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <article aria-label={ariaLabel} className={className}>
      {content}
    </article>
  );
}
