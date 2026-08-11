'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { PasskeySummary } from '@diabetes-universe/identity';
import { addPasskey } from '@diabetes-universe/identity/client';

import {
  deletePasskeyAction,
  type PasskeyMutationState,
} from '../../lib/auth/account-security-actions';

const initialDeleteState: PasskeyMutationState = { status: 'idle' };

function PasskeyRow({ passkey }: { readonly passkey: PasskeySummary }) {
  const [state, action, isPending] = useActionState(
    deletePasskeyAction,
    initialDeleteState,
  );

  return (
    <li className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-950 dark:text-slate-50">
            {passkey.name}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Защищённый способ входа
          </p>
        </div>
        <form action={action}>
          <input name="passkeyId" type="hidden" value={passkey.passkeyId} />
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-60 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
            disabled={isPending}
            type="submit"
          >
            {isPending ? 'Удаляем…' : 'Удалить'}
          </button>
        </form>
      </div>
      {state.message ? (
        <p
          className={`mt-3 text-sm ${state.status === 'error' ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </li>
  );
}

export function PasskeyManager({
  passkeys,
}: {
  readonly passkeys: readonly PasskeySummary[];
}) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAddPasskey() {
    setIsAdding(true);
    setMessage(null);
    const result = await addPasskey('Мой Passkey');

    if (!result.ok) {
      setMessage(
        `${result.message ?? 'Не удалось добавить Passkey.'} Если вы входили давно, выйдите и войдите снова.`,
      );
      setIsAdding(false);
      return;
    }

    setMessage('Passkey добавлен.');
    setIsAdding(false);
    router.refresh();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">
            Passkeys
          </h2>
          <p className="max-w-xl text-sm text-slate-600 dark:text-slate-300">
            Используйте Face ID, Touch ID, Windows Hello, PIN устройства или
            совместимый ключ безопасности. Системное подтверждение выполняет
            ваше устройство.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-60"
          disabled={isAdding}
          onClick={handleAddPasskey}
          type="button"
        >
          {isAdding ? 'Добавляем…' : 'Добавить Passkey'}
        </button>
      </div>

      {message ? (
        <p className="text-sm text-slate-700 dark:text-slate-200" role="status">
          {message}
        </p>
      ) : null}

      {passkeys.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
          Passkey пока не добавлен. Email остаётся резервным способом входа.
        </p>
      ) : (
        <ul className="space-y-3">
          {passkeys.map((passkey) => (
            <PasskeyRow key={passkey.passkeyId} passkey={passkey} />
          ))}
        </ul>
      )}
    </section>
  );
}
