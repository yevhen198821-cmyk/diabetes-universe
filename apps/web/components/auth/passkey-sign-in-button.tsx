'use client';

import { useState } from 'react';

import { signInWithPasskey } from '@diabetes-universe/identity/client';

interface PasskeySignInButtonProps {
  readonly callbackPath: string;
}

export function PasskeySignInButton({
  callbackPath,
}: PasskeySignInButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignIn() {
    setIsPending(true);
    setMessage(null);

    const result = await signInWithPasskey();

    if (!result.ok) {
      setMessage(result.message ?? 'Не удалось выполнить вход с Passkey.');
      setIsPending(false);
      return;
    }

    window.location.assign(callbackPath);
  }

  return (
    <div className="space-y-2">
      <button
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-teal-700 bg-white px-5 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-950 dark:text-teal-200 dark:hover:bg-slate-900"
        disabled={isPending}
        onClick={handleSignIn}
        type="button"
      >
        {isPending ? 'Открываем Passkey…' : 'Войти с Passkey'}
      </button>
      {message ? (
        <p className="text-sm text-rose-600 dark:text-rose-300" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
