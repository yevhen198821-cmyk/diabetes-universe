'use client';

import { useEffect, useState } from 'react';

import { daySummary, timelineEvents } from '../../lib/mocks/timeline';
import { DaySummary } from './day-summary';
import { QuickAdd } from './quick-add';
import { Sidebar } from './sidebar';
import { TimelineList } from './timeline-list';
import { TopBar } from './top-bar';

export function TimelineShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className="min-w-0 lg:ml-72">
        <TopBar
          isDark={isDark}
          onMenuOpen={() => setIsMenuOpen(true)}
          onThemeToggle={() => setIsDark((value) => !value)}
        />

        <main className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="xl:col-start-2 xl:row-start-1">
            <div className="xl:sticky xl:top-28">
              <DaySummary summary={daySummary} />
            </div>
          </div>
          <div className="min-w-0 xl:col-start-1 xl:row-start-1">
            <TimelineList events={timelineEvents} />
          </div>
        </main>
      </div>

      <QuickAdd />
    </div>
  );
}
