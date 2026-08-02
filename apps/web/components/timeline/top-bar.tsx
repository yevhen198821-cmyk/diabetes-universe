import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { iconButton } from './ui-styles';

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <Link
          aria-label="На главную"
          className={`${iconButton} shrink-0`}
          href="/"
        >
          <ArrowLeft aria-hidden="true" size={18} />
        </Link>

        <div
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-700 text-sm font-bold text-white"
        >
          DU
        </div>

        <p className="text-lg font-bold text-slate-950 sm:text-xl">Timeline</p>
      </div>
    </header>
  );
}
