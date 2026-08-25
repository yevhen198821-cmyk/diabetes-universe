'use client';

import { Camera, LoaderCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

import { UserAvatar } from '../shared/user-avatar';

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

function useDialogFocusTrap(
  open: boolean,
  dialogRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  restoreFocusRef?: RefObject<HTMLElement | null>,
) {
  const restoreFocusRefSnapshot = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    restoreFocusRefSnapshot.current =
      restoreFocusRef?.current ??
      (document.activeElement as HTMLElement | null);

    requestAnimationFrame(() => {
      focusableElements(dialogRef.current ?? document.body)[0]?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      restoreFocusRefSnapshot.current?.focus();
    };
  }, [dialogRef, onClose, open, restoreFocusRef]);
}

export interface ProfileAvatarEditorLabels {
  readonly avatarLabel: string;
  readonly choosePhoto: string;
  readonly close: string;
  readonly description: string;
  readonly editAction: string;
  readonly errorGeneric: string;
  readonly errorInvalidType: string;
  readonly errorTooLarge: string;
  readonly removePhoto: string;
  readonly save: string;
  readonly success: string;
  readonly title: string;
  readonly uploading: string;
}

type AvatarEditorStatus = 'idle' | 'uploading' | 'success' | 'error';

export function ProfileAvatarEditor({
  avatarInitials,
  avatarUrl,
  labels,
  onAvatarChange,
}: {
  readonly avatarInitials: string | null;
  readonly avatarUrl: string | null;
  readonly labels: ProfileAvatarEditorLabels;
  readonly onAvatarChange: (avatarUrl: string | null) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<AvatarEditorStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [committedAvatarUrl, setCommittedAvatarUrl] = useState<
    string | null | undefined
  >(undefined);
  const displayedAvatarUrl =
    committedAvatarUrl !== undefined ? committedAvatarUrl : avatarUrl;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useDialogFocusTrap(dialogOpen, dialogRef, closeDialog, triggerRef);

  function resetSelection() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setSelectedFile(null);
    setStatus('idle');
    setErrorMessage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function closeDialog() {
    if (status === 'uploading') {
      return;
    }

    setDialogOpen(false);
    resetSelection();
  }

  function openDialog() {
    resetSelection();
    setDialogOpen(true);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus('idle');
    setErrorMessage(null);
  }

  async function handleSave() {
    if (!selectedFile || status === 'uploading') {
      return;
    }

    setStatus('uploading');
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      const response = await fetch('/api/v1/identity/me/avatar', {
        body: formData,
        method: 'POST',
      });
      const payload = (await response.json()) as {
        readonly avatarUrl?: string | null;
        readonly code?: string;
        readonly ok?: boolean;
      };

      if (!response.ok || !payload.ok || !payload.avatarUrl) {
        const message =
          payload.code === 'AVATAR_TOO_LARGE'
            ? labels.errorTooLarge
            : payload.code === 'AVATAR_INVALID_TYPE'
              ? labels.errorInvalidType
              : labels.errorGeneric;

        setStatus('error');
        setErrorMessage(message);
        return;
      }

      setCommittedAvatarUrl(payload.avatarUrl);
      onAvatarChange(payload.avatarUrl);
      setStatus('success');
      setDialogOpen(false);
      resetSelection();
    } catch {
      setStatus('error');
      setErrorMessage(labels.errorGeneric);
    }
  }

  async function handleRemove() {
    if (status === 'uploading') {
      return;
    }

    setStatus('uploading');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/v1/identity/me/avatar', {
        method: 'DELETE',
      });
      const payload = (await response.json()) as {
        readonly ok?: boolean;
      };

      if (!response.ok || !payload.ok) {
        setStatus('error');
        setErrorMessage(labels.errorGeneric);
        return;
      }

      setCommittedAvatarUrl(null);
      onAvatarChange(null);
      setStatus('success');
      setDialogOpen(false);
      resetSelection();
    } catch {
      setStatus('error');
      setErrorMessage(labels.errorGeneric);
    }
  }

  const previewSource = previewUrl ?? displayedAvatarUrl;

  const dialog = dialogOpen ? (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
      <button
        aria-label={labels.close}
        className="absolute inset-0 bg-slate-950/50"
        disabled={status === 'uploading'}
        onClick={closeDialog}
        type="button"
      />
      <section
        aria-busy={status === 'uploading'}
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="border-border-default bg-surface shadow-elevation-md relative z-[101] w-full max-w-md rounded-t-[1.5rem] border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-[1.5rem] dark:border-white/10 dark:bg-slate-900"
        ref={dialogRef}
        role="dialog"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-text-primary text-lg font-bold" id={titleId}>
              {labels.title}
            </h2>
            <p className="text-text-secondary text-sm" id={descriptionId}>
              {labels.description}
            </p>
          </div>

          <div className="flex justify-center">
            {previewSource ? (
              <div className="border-border-default bg-surface-subtle relative size-28 overflow-hidden rounded-full border">
                <Image
                  alt={labels.avatarLabel}
                  className="size-full object-cover"
                  fill
                  src={previewSource}
                  unoptimized
                />
              </div>
            ) : (
              <UserAvatar
                avatarInitials={avatarInitials}
                avatarLabel={labels.avatarLabel}
                avatarUrl={null}
                sizeClassName="size-28 text-xl"
              />
            )}
          </div>

          {status === 'success' ? (
            <p className="text-status-success text-center text-sm font-medium">
              {labels.success}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="text-status-danger text-center text-sm font-medium">
              {errorMessage}
            </p>
          ) : null}

          <input
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />

          <div className="grid gap-2">
            <button
              className="focus-visible:outline-interactive-primary border-border-default bg-surface-subtle text-text-primary hover:border-border-strong hover:bg-surface min-h-11 rounded-xl border px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950/30"
              disabled={status === 'uploading'}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              {labels.choosePhoto}
            </button>

            {selectedFile ? (
              <button
                className="focus-visible:outline-interactive-primary min-h-11 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
                disabled={status === 'uploading'}
                onClick={() => void handleSave()}
                type="button"
              >
                {status === 'uploading' ? (
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle
                      aria-hidden="true"
                      className="animate-spin"
                      size={16}
                    />
                    {labels.uploading}
                  </span>
                ) : (
                  labels.save
                )}
              </button>
            ) : null}

            {displayedAvatarUrl ? (
              <button
                className="focus-visible:outline-interactive-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-800 transition hover:border-rose-300 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100"
                disabled={status === 'uploading'}
                onClick={() => void handleRemove()}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
                {labels.removePhoto}
              </button>
            ) : null}

            <button
              className="focus-visible:outline-interactive-primary text-text-secondary hover:bg-surface-subtle min-h-11 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
              disabled={status === 'uploading'}
              onClick={closeDialog}
              type="button"
            >
              {labels.close}
            </button>
          </div>
        </div>
      </section>
    </div>
  ) : null;

  return (
    <>
      <div className="relative shrink-0">
        <button
          aria-label={labels.editAction}
          className="focus-visible:outline-interactive-primary group relative rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={openDialog}
          ref={triggerRef}
          type="button"
        >
          <UserAvatar
            avatarInitials={avatarInitials}
            avatarLabel={labels.avatarLabel}
            avatarUrl={displayedAvatarUrl}
          />
          <span className="border-border-default bg-surface text-text-primary shadow-elevation-sm group-hover:border-border-strong absolute right-0 bottom-0 grid size-7 place-items-center rounded-full border transition dark:border-white/10 dark:bg-slate-900">
            <Camera aria-hidden="true" size={14} strokeWidth={2.2} />
          </span>
        </button>
      </div>

      {typeof document !== 'undefined'
        ? createPortal(dialog, document.body)
        : null}
    </>
  );
}
