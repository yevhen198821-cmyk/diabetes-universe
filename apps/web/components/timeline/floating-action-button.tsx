import { Plus, X } from 'lucide-react';

interface FloatingActionButtonProps {
  readonly isOpen?: boolean;
  readonly onClick?: () => void;
}

export function FloatingActionButton({
  isOpen = false,
  onClick,
}: FloatingActionButtonProps) {
  return (
    <button
      aria-expanded={isOpen}
      aria-label={isOpen ? 'Закрыть быстрое добавление' : 'Быстрое добавление'}
      className={`timeline-fab fixed right-4 grid size-12 place-items-center rounded-full bg-teal-700 text-white shadow-md shadow-teal-900/15 transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 active:scale-95 sm:right-6 ${
        isOpen ? 'z-[60]' : 'z-40'
      }`}
      onClick={onClick}
      type="button"
    >
      {isOpen ? (
        <X aria-hidden="true" size={24} strokeWidth={2.25} />
      ) : (
        <Plus aria-hidden="true" size={24} strokeWidth={2.25} />
      )}
    </button>
  );
}
