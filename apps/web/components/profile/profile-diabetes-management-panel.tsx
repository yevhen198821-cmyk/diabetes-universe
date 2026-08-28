'use client';

import { ChevronRight, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  DiabetesTypeCategory,
  GlucoseDisplayUnit,
} from '@diabetes-universe/medical-domain';

import { SessionConfirmDialog } from '../auth/session-confirm-dialog';
import {
  deleteGlucoseTargetProfile,
  fetchDiabetesSettings,
  fetchGlucoseTargetProfile,
  patchDiabetesSettings,
  putGlucoseTargetProfile,
} from '../../lib/medical/client/diabetes-settings-client';
import {
  formatTargetRangeForDisplay,
  toTargetEditorDisplayValue,
} from '../../lib/medical/client/diabetes-settings-display';
import { DiabetesSettingsClientError } from '../../lib/medical/client/diabetes-settings-types';
import type {
  DiabetesSettingsResource,
  GlucoseTargetProfileResource,
} from '../../lib/medical/client/diabetes-settings-types';
import { useLocalization } from '../../lib/platform/react/use-localization';
import {
  buildDiabetesTypeClassification,
  resolveDiabetesTypeCategoryLabel,
  resolveProfileDiabetesManagementLabels,
} from './profile-diabetes-management-labels';
import {
  ProfileDiabetesTargetEditorDialog,
  validateTargetEditorForm,
} from './profile-diabetes-target-editor-dialog';
import {
  profileCardClassName,
  profileInsetSurfaceClassName,
  profileThemeControlActiveClassName,
  profileThemeControlInactiveClassName,
} from './profile-surface-styles';

type LoadState = 'loading' | 'ready' | 'error';

function resolveClientErrorMessage(
  error: unknown,
  messages: ReturnType<typeof resolveProfileDiabetesManagementLabels>['errors'],
): string {
  if (!(error instanceof DiabetesSettingsClientError)) {
    return messages.network;
  }

  switch (error.kind) {
    case 'network':
      return messages.network;
    case 'unauthorized':
      return messages.unauthorized;
    case 'revision_conflict':
      return messages.revisionConflict;
    case 'precondition_required':
      return messages.syncRequired;
    case 'rate_limited':
      return messages.rateLimited;
    default:
      return messages.generic;
  }
}

function ProfileDiabetesLoadingSection() {
  return (
    <div
      className={`${profileInsetSurfaceClassName} animate-pulse space-y-3 px-4 py-4`}
    >
      <div className="bg-surface-subtle h-4 w-1/3 rounded dark:bg-white/10" />
      <div className="bg-surface-subtle h-10 rounded dark:bg-white/10" />
    </div>
  );
}

export function ProfileDiabetesManagementPanel() {
  const router = useRouter();
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveProfileDiabetesManagementLabels(localization),
    [localization],
  );

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [settings, setSettings] = useState<DiabetesSettingsResource | null>(
    null,
  );
  const [targetProfile, setTargetProfile] =
    useState<GlucoseTargetProfileResource | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [unitSaving, setUnitSaving] = useState(false);
  const [typeSaving, setTypeSaving] = useState(false);
  const [targetSaving, setTargetSaving] = useState(false);
  const [otherDescriptorDraft, setOtherDescriptorDraft] = useState('');
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [targetLowInput, setTargetLowInput] = useState('');
  const [targetHighInput, setTargetHighInput] = useState('');
  const [targetValidationMessage, setTargetValidationMessage] = useState<
    string | null
  >(null);
  const targetTriggerRef = useRef<HTMLButtonElement>(null);
  const removeTriggerRef = useRef<HTMLButtonElement>(null);

  const redirectToAuth = useCallback(() => {
    router.push('/auth?callback=%2Faccount%2Fdiabetes');
  }, [router]);

  const reloadResources = useCallback(async () => {
    const [nextSettings, nextTarget] = await Promise.all([
      fetchDiabetesSettings(),
      fetchGlucoseTargetProfile(),
    ]);

    setSettings(nextSettings);
    setTargetProfile(nextTarget);
    setOtherDescriptorDraft(nextSettings.diabetesType.otherDescriptor ?? '');
    setLoadState('ready');
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await reloadResources();

        if (cancelled) {
          return;
        }

        setBannerError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (
          error instanceof DiabetesSettingsClientError &&
          error.kind === 'unauthorized'
        ) {
          redirectToAuth();
          return;
        }

        setLoadState('error');
        setBannerError(resolveClientErrorMessage(error, labels.errors));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [labels.errors, redirectToAuth, reloadResources]);

  const displayUnit = settings?.glucoseDisplayUnit ?? null;
  const targetEditorUnit: GlucoseDisplayUnit = displayUnit ?? 'mmol_per_l';

  const targetDisplayValue = useMemo(() => {
    const range = targetProfile?.defaultRange;

    if (!range) {
      return labels.target.notSet;
    }

    return formatTargetRangeForDisplay(
      range.lowMmolPerL,
      range.highMmolPerL,
      displayUnit,
    );
  }, [displayUnit, labels.target.notSet, targetProfile?.defaultRange]);

  async function handleMutationError(error: unknown) {
    if (
      error instanceof DiabetesSettingsClientError &&
      error.kind === 'unauthorized'
    ) {
      redirectToAuth();
      return;
    }

    if (
      error instanceof DiabetesSettingsClientError &&
      (error.kind === 'revision_conflict' ||
        error.kind === 'precondition_required')
    ) {
      try {
        await reloadResources();
      } catch (reloadError) {
        setBannerError(resolveClientErrorMessage(reloadError, labels.errors));
        return;
      }
    }

    setBannerError(resolveClientErrorMessage(error, labels.errors));
  }

  async function handleUnitChange(nextUnit: GlucoseDisplayUnit) {
    if (!settings || unitSaving || settings.glucoseDisplayUnit === nextUnit) {
      return;
    }

    setUnitSaving(true);
    setBannerError(null);

    try {
      const updated = await patchDiabetesSettings(settings.revision, {
        glucoseDisplayUnit: nextUnit,
      });
      setSettings(updated);
    } catch (error) {
      await handleMutationError(error);
    } finally {
      setUnitSaving(false);
    }
  }

  async function handleDiabetesTypeChange(nextCategory: DiabetesTypeCategory) {
    if (!settings || typeSaving) {
      return;
    }

    const classification = buildDiabetesTypeClassification(
      nextCategory,
      nextCategory === 'other' ? otherDescriptorDraft : '',
    );

    setTypeSaving(true);
    setBannerError(null);

    try {
      const updated = await patchDiabetesSettings(settings.revision, {
        diabetesType: classification,
      });
      setSettings(updated);
      setOtherDescriptorDraft(updated.diabetesType.otherDescriptor ?? '');
    } catch (error) {
      await handleMutationError(error);
    } finally {
      setTypeSaving(false);
    }
  }

  async function handleOtherDescriptorBlur() {
    if (!settings || settings.diabetesType.category !== 'other') {
      return;
    }

    const trimmed = otherDescriptorDraft.trim();
    const current = settings.diabetesType.otherDescriptor ?? '';

    if (trimmed === current) {
      return;
    }

    await handleDiabetesTypeChange('other');
  }

  function openTargetDialog() {
    const range = targetProfile?.defaultRange;

    if (range) {
      setTargetLowInput(
        toTargetEditorDisplayValue(range.lowMmolPerL, targetEditorUnit),
      );
      setTargetHighInput(
        toTargetEditorDisplayValue(range.highMmolPerL, targetEditorUnit),
      );
    } else {
      setTargetLowInput('');
      setTargetHighInput('');
    }

    setTargetValidationMessage(null);
    setTargetDialogOpen(true);
  }

  async function handleTargetSave() {
    if (!targetProfile) {
      return;
    }

    const validation = validateTargetEditorForm(
      targetLowInput,
      targetHighInput,
      targetEditorUnit,
      labels,
    );

    if (!validation.ok) {
      setTargetValidationMessage(validation.message);
      return;
    }

    setTargetSaving(true);
    setTargetValidationMessage(null);
    setBannerError(null);

    try {
      const updated = await putGlucoseTargetProfile(targetProfile.revision, {
        lowMmolPerL: validation.lowMmolPerL,
        highMmolPerL: validation.highMmolPerL,
      });
      setTargetProfile(updated);
      setTargetDialogOpen(false);
    } catch (error) {
      await handleMutationError(error);
    } finally {
      setTargetSaving(false);
    }
  }

  async function handleTargetRemove() {
    if (!targetProfile?.defaultRange) {
      return;
    }

    setTargetSaving(true);
    setBannerError(null);

    try {
      const updated = await deleteGlucoseTargetProfile(targetProfile.revision);
      setTargetProfile(updated);
      setRemoveDialogOpen(false);
    } catch (error) {
      await handleMutationError(error);
    } finally {
      setTargetSaving(false);
    }
  }

  const diabetesTypeValue = settings?.diabetesType.category ?? 'unknown';
  const diabetesTypeOptions: ReadonlyArray<{
    readonly id: DiabetesTypeCategory;
    readonly label: string;
  }> = [
    { id: 'type_1', label: labels.diabetesType.type1 },
    { id: 'type_2', label: labels.diabetesType.type2 },
    { id: 'gestational', label: labels.diabetesType.gestational },
    { id: 'other', label: labels.diabetesType.other },
    { id: 'unknown', label: labels.diabetesType.unknown },
  ];

  return (
    <div className={`${profileCardClassName} space-y-5 p-6`}>
      <header className="space-y-2">
        <h2 className="text-text-primary text-lg font-bold">
          {labels.page.title}
        </h2>
        <p className="text-text-secondary text-sm">{labels.page.description}</p>
      </header>

      {bannerError ? (
        <p
          className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
          role="alert"
        >
          {bannerError}
        </p>
      ) : null}

      {loadState === 'loading' ? (
        <div aria-busy="true" className="space-y-3">
          <p className="text-text-secondary sr-only">{labels.loading}</p>
          <ProfileDiabetesLoadingSection />
          <ProfileDiabetesLoadingSection />
          <ProfileDiabetesLoadingSection />
        </div>
      ) : null}

      {loadState === 'ready' && settings && targetProfile ? (
        <div className="space-y-3">
          <section
            aria-labelledby="profile-diabetes-glucose-heading"
            className={`${profileInsetSurfaceClassName} space-y-3 px-4 py-4`}
          >
            <div className="space-y-1">
              <h3
                className="text-text-primary text-sm font-semibold"
                id="profile-diabetes-glucose-heading"
              >
                {labels.glucose.title}
              </h3>
              <p className="text-text-secondary text-xs">
                {labels.glucose.description}
              </p>
            </div>

            {displayUnit === null ? (
              <p className="text-text-secondary text-sm">
                {labels.glucose.unconfigured}
              </p>
            ) : (
              <p className="text-text-primary text-sm font-semibold">
                {displayUnit === 'mmol_per_l'
                  ? labels.glucose.unitMmol
                  : labels.glucose.unitMg}
              </p>
            )}

            <div
              aria-label={labels.glucose.title}
              className="grid grid-cols-2 gap-2"
              role="group"
            >
              {(
                [
                  { id: 'mmol_per_l', label: labels.glucose.unitMmol },
                  { id: 'mg_per_dl', label: labels.glucose.unitMg },
                ] as const
              ).map((option) => {
                const isActive = settings.glucoseDisplayUnit === option.id;

                return (
                  <button
                    aria-pressed={isActive}
                    className={`focus-visible:outline-interactive-primary min-h-11 rounded-xl border px-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-sm ${
                      isActive
                        ? profileThemeControlActiveClassName
                        : profileThemeControlInactiveClassName
                    }`}
                    disabled={unitSaving}
                    key={option.id}
                    onClick={() => void handleUnitChange(option.id)}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section
            aria-labelledby="profile-diabetes-type-heading"
            className={`${profileInsetSurfaceClassName} space-y-3 px-4 py-4`}
          >
            <div className="space-y-1">
              <h3
                className="text-text-primary text-sm font-semibold"
                id="profile-diabetes-type-heading"
              >
                {labels.diabetesType.title}
              </h3>
              <p className="text-text-secondary text-xs">
                {labels.diabetesType.description}
              </p>
              <p className="text-text-secondary text-xs">
                {labels.diabetesType.selfReportedNote}
              </p>
            </div>

            <p className="text-text-primary text-sm font-semibold">
              {resolveDiabetesTypeCategoryLabel(labels, diabetesTypeValue)}
            </p>

            <label className="block space-y-1.5">
              <span className="text-text-primary text-sm font-semibold">
                {labels.diabetesType.title}
              </span>
              <select
                className="focus-visible:outline-interactive-primary text-text-primary border-border-default bg-surface-subtle min-h-11 w-full rounded-xl border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/10 dark:bg-slate-950/40"
                disabled={typeSaving}
                onChange={(event) =>
                  void handleDiabetesTypeChange(
                    event.target.value as DiabetesTypeCategory,
                  )
                }
                value={diabetesTypeValue}
              >
                {diabetesTypeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {settings.diabetesType.category === 'other' ? (
              <label className="block space-y-1.5">
                <span className="text-text-primary text-sm font-semibold">
                  {labels.diabetesType.otherLabel}
                </span>
                <input
                  className="focus-visible:outline-interactive-primary text-text-primary border-border-default bg-surface-subtle min-h-11 w-full rounded-xl border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/10 dark:bg-slate-950/40"
                  disabled={typeSaving}
                  maxLength={256}
                  onBlur={() => void handleOtherDescriptorBlur()}
                  onChange={(event) =>
                    setOtherDescriptorDraft(event.target.value)
                  }
                  type="text"
                  value={otherDescriptorDraft}
                />
              </label>
            ) : null}
          </section>

          <section
            aria-labelledby="profile-diabetes-target-heading"
            className={`${profileInsetSurfaceClassName} space-y-3 px-4 py-4`}
          >
            <div className="space-y-1">
              <h3
                className="text-text-primary text-sm font-semibold"
                id="profile-diabetes-target-heading"
              >
                {labels.target.title}
              </h3>
            </div>

            <button
              className="focus-visible:outline-interactive-primary border-border-default bg-surface hover:border-border-strong flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/10 dark:bg-slate-950/20"
              onClick={openTargetDialog}
              ref={targetTriggerRef}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-200 dark:bg-teal-400/15 dark:text-teal-100 dark:ring-teal-300/25">
                  <Target aria-hidden="true" size={16} strokeWidth={2.2} />
                </span>
                <span className="min-w-0">
                  <span className="text-text-primary block text-sm font-semibold">
                    {labels.target.title}
                  </span>
                  <span className="text-text-secondary mt-0.5 block truncate text-xs">
                    {targetDisplayValue}
                  </span>
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="text-text-secondary shrink-0"
                size={18}
              />
            </button>

            {targetProfile.defaultRange ? (
              <button
                className="text-text-secondary hover:text-text-primary focus-visible:outline-interactive-primary min-h-11 text-sm font-semibold underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                disabled={targetSaving}
                onClick={() => setRemoveDialogOpen(true)}
                ref={removeTriggerRef}
                type="button"
              >
                {labels.target.remove}
              </button>
            ) : null}
          </section>

          <p className="text-text-secondary px-1 text-xs">
            {labels.disclaimer}
          </p>
        </div>
      ) : null}

      <ProfileDiabetesTargetEditorDialog
        displayUnit={targetEditorUnit}
        highValue={targetHighInput}
        isPending={targetSaving}
        labels={labels}
        lowValue={targetLowInput}
        onCancel={() => {
          if (targetSaving) {
            return;
          }

          setTargetDialogOpen(false);
          setTargetValidationMessage(null);
        }}
        onHighValueChange={setTargetHighInput}
        onLowValueChange={setTargetLowInput}
        onSave={() => void handleTargetSave()}
        open={targetDialogOpen}
        triggerRef={targetTriggerRef}
        validationMessage={targetValidationMessage}
      />

      <SessionConfirmDialog
        cancelLabel={labels.target.removeConfirm.cancel}
        confirmLabel={labels.target.removeConfirm.confirm}
        description={labels.target.removeConfirm.description}
        isPending={targetSaving}
        onCancel={() => {
          if (targetSaving) {
            return;
          }

          setRemoveDialogOpen(false);
        }}
        onConfirm={() => void handleTargetRemove()}
        open={removeDialogOpen}
        title={labels.target.removeConfirm.title}
        triggerRef={removeTriggerRef}
      />
    </div>
  );
}
