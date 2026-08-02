import { Plus } from 'lucide-react';
import { forwardRef } from 'react';

interface FloatingActionButtonProps {
  readonly className?: string;
  readonly onClick?: () => void;
}

export const FloatingActionButton = forwardRef<
  HTMLButtonElement,
  FloatingActionButtonProps
>(function FloatingActionButton({ className = '', onClick }, ref) {
  return (
    <button
      aria-label="Добавить событие"
      className={`fixed z-40 grid size-12 place-items-center rounded-full bg-teal-700 text-white shadow-md shadow-teal-900/15 transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 active:scale-95 ${className}`}
      onClick={onClick}
      ref={ref}
      type="button"
    >
      <Plus aria-hidden="true" size={24} strokeWidth={2.25} />
    </button>
  );
});
