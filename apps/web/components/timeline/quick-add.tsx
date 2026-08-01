'use client';

import { Button } from '@diabetes-universe/ui';
import {
  Activity,
  CookingPot,
  Droplets,
  FileText,
  Pill,
  Plus,
  Syringe,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface QuickAction {
  readonly label: string;
  readonly icon: LucideIcon;
}

const quickActions: readonly QuickAction[] = [
  { label: 'Глюкоза', icon: Droplets },
  { label: 'Инсулин', icon: Syringe },
  { label: 'Питание', icon: CookingPot },
  { label: 'Лекарство', icon: Pill },
  { label: 'Активность', icon: Activity },
  { label: 'Заметка', icon: FileText },
];

export function QuickAdd() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen ? (
        <section
          aria-label="Быстрое добавление"
          className="fixed right-4 bottom-24 z-40 w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/15 sm:right-6 dark:border-slate-700 dark:bg-slate-900"
          id="quick-add-panel"
        >
          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <h2 className="font-bold text-slate-950 dark:text-white">
                Добавить событие
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Выберите тип записи
              </p>
            </div>
            <button
              aria-label="Закрыть быстрое добавление"
              className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:hover:bg-slate-800"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {quickActions.map(({ icon: Icon, label }) => (
              <button
                className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-teal-700 dark:hover:bg-teal-950/40 dark:hover:text-teal-200"
                key={label}
                type="button"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
                  <Icon aria-hidden="true" size={18} />
                </span>
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 px-1 text-[11px] text-slate-400">
            Сохранение будет доступно в следующих версиях.
          </p>
        </section>
      ) : null}

      <Button
        aria-controls="quick-add-panel"
        aria-expanded={isOpen}
        aria-label={
          isOpen ? 'Закрыть быстрое добавление' : 'Открыть быстрое добавление'
        }
        className="fixed right-4 bottom-4 z-40 grid size-14 place-items-center rounded-full p-0 shadow-xl shadow-teal-900/25 sm:right-6 sm:bottom-6"
        onClick={() => setIsOpen((value) => !value)}
      >
        {isOpen ? (
          <X aria-hidden="true" size={25} />
        ) : (
          <Plus aria-hidden="true" size={28} />
        )}
      </Button>
    </>
  );
}
