import { Search, X } from 'lucide-react';
import type { KeyboardEvent } from 'react';

import { formFieldClass } from '@diabetes-universe/ui';

import type { TimelineUiLabels } from './timeline-ui-labels';

interface TimelineSearchProps {
  readonly labels: TimelineUiLabels['search'];
  readonly onChange: (query: string) => void;
  readonly query: string;
}

export function TimelineSearch({
  labels,
  onChange,
  query,
}: TimelineSearchProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && query.length > 0) {
      event.preventDefault();
      onChange('');
    }
  };

  return (
    <div className="relative">
      <label className="sr-only" htmlFor="timeline-search">
        {labels.label}
      </label>
      <Search
        aria-hidden="true"
        className="text-text-tertiary absolute top-1/2 left-3 -translate-y-1/2"
        size={18}
      />
      <input
        className={`${formFieldClass} shadow-elevation-sm pr-11 pl-10`}
        id="timeline-search"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={labels.placeholder}
        type="search"
        value={query}
      />
      {query.length > 0 ? (
        <button
          aria-label={labels.clear}
          className="text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-interactive-primary absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg transition focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={() => onChange('')}
          type="button"
        >
          <X aria-hidden="true" size={16} />
        </button>
      ) : null}
    </div>
  );
}
