import type { NextStep } from '@diabetes-universe/types';
import { Button } from '@diabetes-universe/ui';
import { Syringe } from 'lucide-react';

import { surfaceCard } from './ui-styles';

interface NextStepPanelProps {
  readonly nextStep: NextStep;
}

export function NextStepPanel({ nextStep }: NextStepPanelProps) {
  return (
    <section
      aria-labelledby="next-step-title"
      className={`${surfaceCard} border-teal-200 p-5 sm:p-6`}
    >
      <p className="text-sm font-medium text-slate-500">{nextStep.title}</p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"
        >
          <Syringe size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-slate-950" id="next-step-title">
            {nextStep.description}
          </h2>
        </div>
        <Button className="w-full sm:w-auto" type="button">
          {nextStep.actionLabel}
        </Button>
      </div>
    </section>
  );
}
