'use client';

import { useActionState } from 'react';

import { AUTH_UNAVAILABLE_MESSAGE } from '@diabetes-universe/identity';

import {
  requestMagicLinkAction,
  type RequestMagicLinkState,
} from '../../lib/auth/request-magic-link-action';

const initialState: RequestMagicLinkState = {
  status: 'idle',
};

interface SignInFormProps {
  readonly callbackPath?: string;
  readonly isAuthAvailable: boolean;
}

export function SignInForm({
  callbackPath = '/account',
  isAuthAvailable,
}: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(
    requestMagicLinkAction,
    initialState,
  );

  if (!isAuthAvailable) {
    return (
      <div
        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
        role="alert"
      >
        {AUTH_UNAVAILABLE_MESSAGE}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input name="callbackPath" type="hidden" value={callbackPath} />

      <div className="space-y-2">
        <label
          className="text-sm font-semibold text-slate-800 dark:text-slate-100"
          htmlFor="auth-email"
        >
          Email
        </label>
        <input
          aria-describedby={state.message ? 'auth-email-hint' : undefined}
          aria-invalid={state.message ? true : undefined}
          autoComplete="email"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
          id="auth-email"
          inputMode="email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
        {state.message ? (
          <p
            className="text-sm text-rose-600 dark:text-rose-300"
            id="auth-email-hint"
            role="alert"
          >
            {state.message}
          </p>
        ) : (
          <p
            className="text-sm text-slate-600 dark:text-slate-300"
            id="auth-email-hint"
          >
            Мы отправим одноразовую ссылку для входа. Пароль не нужен.
          </p>
        )}
      </div>

      <button
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? 'Отправляем ссылку…' : 'Продолжить'}
      </button>
    </form>
  );
}
