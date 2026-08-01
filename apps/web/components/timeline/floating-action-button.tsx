import { Plus } from 'lucide-react';

export function FloatingActionButton() {
  return (
    <button
      aria-label="Добавить"
      className="timeline-fab fixed right-4 z-40 grid size-12 place-items-center rounded-full bg-teal-700 text-white shadow-md shadow-teal-900/15 transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 active:scale-95 sm:right-6"
      type="button"
    >
      <Plus aria-hidden="true" size={24} strokeWidth={2.25} />
    </button>
  );
}
