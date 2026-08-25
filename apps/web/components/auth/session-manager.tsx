'use client';

import type { AccountSessionSummary } from '@diabetes-universe/identity';
import {
  useActionState,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from 'react';

import { signOutCurrentSessionAction } from '../../lib/auth/account-security-actions';
import {
  reauthenticateForSessionsAction,
  revokeAccountSessionAction,
  revokeAllAccountSessionsAction,
  revokeOtherAccountSessionsAction,
} from '../../lib/auth/session-management-actions';
import {
  initialSessionMutationState,
  type SessionMutationState,
} from '../../lib/auth/session-management-state';
import { useFormatter } from '../../lib/platform/react/use-formatter';
import { useLocalization } from '../../lib/platform/react/use-localization';
import {
  SessionConfirmDialog,
  SessionStatusMessage,
} from './session-confirm-dialog';
import {
  formatRevokeOneConfirmationDescription,
  resolveSessionManagerLabels,
} from './session-manager-labels';
import {
  createSessionCardViewModel,
  createSessionManagerViewModel,
  shouldShowFreshAuthAlert,
} from './session-manager-model';

interface SessionManagerProps {
  readonly passkeyManagementEnabled: boolean;
  readonly sessions: readonly AccountSessionSummary[];
}

function mutationTone(state: SessionMutationState): 'error' | 'success' | null {
  if (state.status === 'idle' || !state.message) {
    return null;
  }

  return state.status;
}

function SessionCard({
  card,
  labels,
  revokeFormAction,
  revokePending,
  revokeState,
}: {
  readonly card: ReturnType<typeof createSessionCardViewModel>;
  readonly labels: ReturnType<typeof resolveSessionManagerLabels>;
  readonly revokeFormAction?: ComponentProps<'form'>['action'];
  readonly revokePending?: boolean;
  readonly revokeState?: SessionMutationState;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <li className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <div className="flex flex-col gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-950 dark:text-slate-50">
              {card.session.clientLabel}
            </p>
            {card.isCurrentSession ? (
              <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200">
                {labels.currentBadge}
              </span>
            ) : null}
          </div>
          <dl className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <div>
              <dt className="sr-only">{labels.signedIn}</dt>
              <dd>
                {labels.signedIn}:{' '}
                <time dateTime={card.session.createdAt}>
                  {card.createdAtLabel}
                </time>
              </dd>
            </div>
            <div>
              <dt className="sr-only">{labels.expires}</dt>
              <dd>
                {labels.expires}:{' '}
                <time dateTime={card.session.expiresAt}>
                  {card.expiresAtLabel}
                </time>
              </dd>
            </div>
          </dl>
        </div>

        {card.isCurrentSession ? (
          <form action={signOutCurrentSessionAction}>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-900"
              type="submit"
            >
              {labels.signOut}
            </button>
          </form>
        ) : revokeFormAction ? (
          <>
            <form action={revokeFormAction} ref={formRef}>
              <input
                name="sessionId"
                type="hidden"
                value={card.session.sessionId}
              />
            </form>
            <button
              className="inline-flex min-h-11 items-center justify-center self-start rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-60 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
              disabled={revokePending}
              onClick={() => setConfirmOpen(true)}
              ref={triggerRef}
              type="button"
            >
              {revokePending ? labels.revokeOnePending : labels.revokeOne}
            </button>
            <SessionConfirmDialog
              cancelLabel={labels.cancel}
              confirmLabel={labels.revokeOne}
              description={formatRevokeOneConfirmationDescription(
                labels.confirmRevokeOneDescriptionTemplate,
                card.session.clientLabel,
              )}
              isPending={revokePending}
              onCancel={() => setConfirmOpen(false)}
              onConfirm={() => {
                setConfirmOpen(false);
                formRef.current?.requestSubmit();
              }}
              open={confirmOpen}
              title={labels.confirmRevokeOneTitle}
              triggerRef={triggerRef}
            />
          </>
        ) : null}
      </div>

      {shouldShowFreshAuthAlert(revokeState?.code) ? (
        <div className="mt-3">
          <FreshAuthAlert labels={labels} />
        </div>
      ) : null}

      {revokeState &&
      mutationTone(revokeState) &&
      !shouldShowFreshAuthAlert(revokeState.code) ? (
        <div className="mt-3">
          <SessionStatusMessage tone={mutationTone(revokeState)!}>
            {revokeState.message}
          </SessionStatusMessage>
        </div>
      ) : null}
    </li>
  );
}

function OtherSessionRow({
  labels,
  session,
}: {
  readonly labels: ReturnType<typeof resolveSessionManagerLabels>;
  readonly session: AccountSessionSummary;
}) {
  const formatter = useFormatter();
  const [state, action, isPending] = useActionState(
    revokeAccountSessionAction,
    initialSessionMutationState,
  );
  const card = createSessionCardViewModel({
    formatDate: (isoTimestamp) => formatter.formatDate(isoTimestamp),
    session,
  });

  return (
    <SessionCard
      card={card}
      labels={labels}
      revokeFormAction={action}
      revokePending={isPending}
      revokeState={state}
    />
  );
}

function FreshAuthAlert({
  labels,
}: {
  readonly labels: ReturnType<typeof resolveSessionManagerLabels>;
}) {
  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30"
      role="alert"
    >
      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
        {labels.freshAuthMessage}
      </p>
      <form action={reauthenticateForSessionsAction} className="mt-3">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-700 px-4 text-sm font-semibold text-white transition hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
          type="submit"
        >
          {labels.freshAuthAction}
        </button>
      </form>
    </div>
  );
}

function BulkActions({
  labels,
  showRevokeOthersAction,
}: {
  readonly labels: ReturnType<typeof resolveSessionManagerLabels>;
  readonly showRevokeOthersAction: boolean;
}) {
  const othersTriggerRef = useRef<HTMLButtonElement>(null);
  const allTriggerRef = useRef<HTMLButtonElement>(null);
  const othersFormRef = useRef<HTMLFormElement>(null);
  const allFormRef = useRef<HTMLFormElement>(null);
  const [othersConfirmOpen, setOthersConfirmOpen] = useState(false);
  const [allConfirmOpen, setAllConfirmOpen] = useState(false);
  const [othersState, othersAction, othersPending] = useActionState(
    revokeOtherAccountSessionsAction,
    initialSessionMutationState,
  );
  const [allState, allAction, allPending] = useActionState(
    revokeAllAccountSessionsAction,
    initialSessionMutationState,
  );

  const showFreshAuth =
    shouldShowFreshAuthAlert(othersState.code) ||
    shouldShowFreshAuthAlert(allState.code);

  return (
    <div className="space-y-6">
      {showFreshAuth ? <FreshAuthAlert labels={labels} /> : null}

      {othersState.message &&
      mutationTone(othersState) &&
      !shouldShowFreshAuthAlert(othersState.code) ? (
        <SessionStatusMessage tone={mutationTone(othersState)!}>
          {othersState.message}
        </SessionStatusMessage>
      ) : null}

      {allState.message &&
      mutationTone(allState) &&
      !shouldShowFreshAuthAlert(allState.code) ? (
        <SessionStatusMessage tone={mutationTone(allState)!}>
          {allState.message}
        </SessionStatusMessage>
      ) : null}

      {showRevokeOthersAction ? (
        <>
          <form action={othersAction} ref={othersFormRef} />
          <button
            aria-busy={othersPending}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-60 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
            disabled={othersPending}
            onClick={() => setOthersConfirmOpen(true)}
            ref={othersTriggerRef}
            type="button"
          >
            {othersPending ? labels.revokeOthersPending : labels.revokeOthers}
          </button>
          <SessionConfirmDialog
            cancelLabel={labels.cancel}
            confirmLabel={labels.revokeOthers}
            description={labels.confirmRevokeOthersDescription}
            isPending={othersPending}
            onCancel={() => setOthersConfirmOpen(false)}
            onConfirm={() => {
              setOthersConfirmOpen(false);
              othersFormRef.current?.requestSubmit();
            }}
            open={othersConfirmOpen}
            title={labels.confirmRevokeOthersTitle}
            triggerRef={othersTriggerRef}
          />
          <hr className="border-slate-200 dark:border-slate-800" />
        </>
      ) : null}

      <form action={allAction} ref={allFormRef} />
      <button
        aria-busy={allPending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-rose-200 bg-transparent px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-60 dark:border-rose-900/80 dark:bg-slate-950/20 dark:text-rose-300 dark:hover:bg-rose-950/30"
        disabled={allPending}
        onClick={() => setAllConfirmOpen(true)}
        ref={allTriggerRef}
        type="button"
      >
        {allPending ? labels.revokeAllPending : labels.revokeAll}
      </button>
      <SessionConfirmDialog
        cancelLabel={labels.cancel}
        confirmLabel={labels.confirmRevokeAllConfirm}
        description={labels.confirmRevokeAllDescription}
        isPending={allPending}
        onCancel={() => setAllConfirmOpen(false)}
        onConfirm={() => {
          setAllConfirmOpen(false);
          allFormRef.current?.requestSubmit();
        }}
        open={allConfirmOpen}
        title={labels.confirmRevokeAllTitle}
        triggerRef={allTriggerRef}
      />
    </div>
  );
}

export function SessionManager({
  passkeyManagementEnabled,
  sessions,
}: SessionManagerProps) {
  const localization = useLocalization();
  const formatter = useFormatter();
  const labels = useMemo(
    () => resolveSessionManagerLabels(localization),
    [localization],
  );
  const viewModel = useMemo(
    () => createSessionManagerViewModel(sessions),
    [sessions],
  );

  const currentCard = viewModel.currentSession
    ? createSessionCardViewModel({
        formatDate: (isoTimestamp) => formatter.formatDate(isoTimestamp),
        session: viewModel.currentSession,
      })
    : null;

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {labels.description}
          </p>
          {passkeyManagementEnabled ? (
            <a
              className="inline-flex text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300"
              href="/account/security"
            >
              {labels.passkeysLink}
            </a>
          ) : null}
        </div>

        <ul className="space-y-3">
          {currentCard ? (
            <SessionCard card={currentCard} labels={labels} />
          ) : null}
          {viewModel.otherSessions.map((session) => (
            <OtherSessionRow
              key={session.sessionId}
              labels={labels}
              session={session}
            />
          ))}
        </ul>

        {!viewModel.showRevokeOthersAction ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            {labels.emptyOthers}
          </p>
        ) : null}
      </section>

      <BulkActions
        labels={labels}
        showRevokeOthersAction={viewModel.showRevokeOthersAction}
      />
    </div>
  );
}
