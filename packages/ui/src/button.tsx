import { forwardRef, type ButtonHTMLAttributes } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className = '', type = 'button', ...props }, ref) {
    return (
      <button
        className={`rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        type={type}
        {...props}
      />
    );
  },
);
