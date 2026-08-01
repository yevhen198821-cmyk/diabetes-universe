import type { LastGlucose } from '@diabetes-universe/types';
import { Droplets } from 'lucide-react';

import { surfaceCard } from './ui-styles';

interface LastGlucoseCardProps {
  readonly glucose: LastGlucose;
}

export function LastGlucoseCard({ glucose }: LastGlucoseCardProps) {
  return (
    <section
      aria-labelledby="last-glucose-title"
      className={`${surfaceCard} flex items-center gap-4 p-5`}
    >
      <div
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600"
      >
        <Droplets size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500">Последнее измерение</p>
        <h2
          className="mt-0.5 text-lg font-bold text-slate-950"
          id="last-glucose-title"
        >
          Последняя глюкоза
        </h2>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xl font-bold text-slate-950">{glucose.value}</p>
        <time
          className="mt-0.5 block text-sm text-slate-500 tabular-nums"
          dateTime={glucose.time}
        >
          {glucose.time}
        </time>
      </div>
    </section>
  );
}
