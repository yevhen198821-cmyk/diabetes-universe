import type { ReactNode } from 'react';

import { eventTypeAppearances } from '../../theme/event-type-appearance';
import type { EventCardProps, EventCardStatus, EventCardType } from './EventCard.types';

const statusLabels: Record<EventCardStatus, string> = {
  default: '',
  completed: 'Выполнено',
  scheduled: 'Запланировано',
  missed: 'Пропущено',
  error: 'Ошибка',
};

const vibrantAccents: Record<EventCardType, string> = {
  glucose: 'bg-teal-500 text-white shadow-[0_6px_16px_rgba(20,184,166,0.32)]',
  insulin: 'bg-violet-500 text-white shadow-[0_6px_16px_rgba(139,92,246,0.32)]',
  nutrition: 'bg-orange-500 text-white shadow-[0_6px_16px_rgba(249,115,22,0.32)]',
  activity: 'bg-blue-500 text-white shadow-[0_6px_16px_rgba(59,130,246,0.32)]',
  medication: 'bg-rose-500 text-white shadow-[0_6px_16px_rgba(244,63,94,0.32)]',
  reminder: 'bg-orange-500 text-white shadow-[0_6px_16px_rgba(249,115,22,0.32)]',
  note: 'bg-emerald-500 text-white shadow-[0_6px_16px_rgba(16,185,129,0.32)]',
  ai_insight: 'bg-teal-500 text-white shadow-[0_6px_16px_rgba(20,184,166,0.32)]',
};

function EventIcon({
  accent,
  children,
  compact = false,
  vibrant = false,
}: {
  readonly accent: string;
  readonly children: ReactNode;
  readonly compact?: boolean;
  readonly vibrant?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center text-xs font-bold ${accent} ${
        compact
          ? vibrant
            ? 'absolute top-3 -left-10 size-8 rounded-full border-4 border-[#f7fafd] sm:-left-[2.875rem] dark:border-slate-900/90'
            : 'absolute top-3 -left-10 size-8 rounded-lg border-4 border-slate-50 sm:-left-[2.875rem]'
          : vibrant
            ? 'size-9 rounded-full'
            : 'size-9 rounded-lg'
      }`}
    >
      {children}
    </span>
  );
}

export function EventCard({
  ariaLabel: providedAriaLabel,
  appearance = 'default',
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
  const resolvedAccent = appearance === 'vibrant' ? vibrantAccents[type] : accent;
  const isVibrant = appearance === 'vibrant';
  const statusLabel = statusLabels[status];
  const ariaLabel =
    providedAriaLabel ??
    [time, title, value, unit, context, statusLabel].filter(Boolean).join(', ');
  const isCompact = variant === 'compact';

  const compactContent = (
    <>
      <time
        className="text-sm font-medium text-slate-500 tabular-nums"
        dateTime={time}
      >
        {time}
      </time>

      <EventIcon accent={resolvedAccent} compact vibrant={isVibrant}>
        {icon ?? fallbackIcon}
      </EventIcon>

      <span className="min-w-0">
        <span
          className={`block text-base font-bold sm:text-lg ${
            isVibrant ? 'text-[#1e3a5f] dark:text-white' : 'text-slate-950'
          }`}
        >
          {value} {unit}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span
            className={`text-sm ${isVibrant ? 'font-semibold text-[#1e3a5f]/85 dark:text-slate-200' : 'text-slate-600'}`}
          >
            {title}
          </span>
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

      <EventIcon accent={resolvedAccent} vibrant={isVibrant}>
        {icon ?? fallbackIcon}
      </EventIcon>

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

  const className = `w-full items-center gap-3 text-left transition ${
    isVibrant
      ? 'rounded-[1.25rem] border border-white/85 bg-white/78 shadow-[0_10px_28px_rgba(15,23,42,0.05)] backdrop-blur hover:border-white hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900/78'
      : 'rounded-xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md'
  } ${
    isCompact
      ? 'relative grid min-h-14 grid-cols-[3rem_minmax(0,1fr)] px-3 py-2.5'
      : 'flex min-h-16 px-4 py-3'
  }`;
  const content = isCompact ? compactContent : standardContent;

  if (onClick) {
    return (
      <button
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className={`${className} cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700`}
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
