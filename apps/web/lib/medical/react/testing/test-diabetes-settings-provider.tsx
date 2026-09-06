'use client';

import type { GlucoseDisplayUnit } from '@diabetes-universe/medical-domain';
import { useMemo, useState, type ReactNode } from 'react';

import type { DiabetesSettingsResource } from '../../client/diabetes-settings-types';
import { DiabetesSettingsClientError } from '../../client/diabetes-settings-types';
import {
  DiabetesSettingsContext,
  type DiabetesSettingsContextValue,
  type DiabetesSettingsLoadState,
} from '../diabetes-settings-provider';

export interface TestDiabetesSettingsProviderProps {
  readonly children: ReactNode;
  readonly error?: DiabetesSettingsClientError | null;
  readonly glucoseDisplayUnit?: GlucoseDisplayUnit | null;
  readonly loadState?: DiabetesSettingsLoadState;
  readonly onRefresh?: () => Promise<void>;
  readonly onSelectGlucoseDisplayUnit?: (
    unit: GlucoseDisplayUnit,
  ) => Promise<void> | void;
  readonly settings?: DiabetesSettingsResource | null;
}

function createTestSettings(
  glucoseDisplayUnit: GlucoseDisplayUnit | null,
): DiabetesSettingsResource {
  return {
    configured: true,
    createdAt: '2026-08-02T00:00:00.000Z',
    diabetesType: {
      category: 'unknown',
      source: 'self_reported',
    },
    glucoseDisplayUnit,
    revision: '1',
    settingsId: '00000000-0000-4000-8000-000000000001',
    subjectId: '00000000-0000-4000-8000-000000000002',
    updatedAt: '2026-08-02T00:00:00.000Z',
  };
}

export function TestDiabetesSettingsProvider({
  children,
  error = null,
  glucoseDisplayUnit = null,
  loadState = 'ready',
  onRefresh = async () => {},
  onSelectGlucoseDisplayUnit,
  settings,
}: TestDiabetesSettingsProviderProps) {
  const [sessionDisplayUnit, setSessionDisplayUnit] =
    useState<GlucoseDisplayUnit | null>(null);
  const [refreshOutcome, setRefreshOutcome] = useState<{
    readonly error: DiabetesSettingsClientError | null;
    readonly loadState: DiabetesSettingsLoadState;
  } | null>(null);

  const value = useMemo<DiabetesSettingsContextValue>(() => {
    const resolvedSettings =
      settings === undefined
        ? createTestSettings(glucoseDisplayUnit)
        : settings;
    const resolvedLoadState = refreshOutcome?.loadState ?? loadState;
    const resolvedError =
      resolvedLoadState === 'error' ? (refreshOutcome?.error ?? error) : null;
    const resolvedGlucoseDisplayUnit =
      resolvedLoadState === 'ready'
        ? (resolvedSettings?.glucoseDisplayUnit ?? sessionDisplayUnit)
        : sessionDisplayUnit;

    return {
      error: resolvedError,
      glucoseDisplayUnit: resolvedGlucoseDisplayUnit,
      isUnconfigured:
        resolvedLoadState === 'ready' && resolvedGlucoseDisplayUnit == null,
      loadState: resolvedLoadState,
      patchGlucoseDisplayUnit: async (unit) => ({
        ...(resolvedSettings ?? createTestSettings(unit)),
        glucoseDisplayUnit: unit,
      }),
      refresh: async () => {
        setRefreshOutcome({ error: null, loadState: 'loading' });

        try {
          await onRefresh();
          setRefreshOutcome({ error: null, loadState: 'ready' });
        } catch (caughtError) {
          setRefreshOutcome({
            error:
              caughtError instanceof DiabetesSettingsClientError
                ? caughtError
                : new DiabetesSettingsClientError(
                    'network',
                    'Network request failed.',
                  ),
            loadState: 'error',
          });
        }
      },
      selectGlucoseDisplayUnit: async (unit) => {
        if (onSelectGlucoseDisplayUnit) {
          await onSelectGlucoseDisplayUnit(unit);
        }

        setSessionDisplayUnit(unit);
      },
      settings: resolvedLoadState === 'ready' ? resolvedSettings : null,
      updateSettingsFromMutation: () => {},
    };
  }, [
    error,
    glucoseDisplayUnit,
    loadState,
    onRefresh,
    refreshOutcome,
    onSelectGlucoseDisplayUnit,
    sessionDisplayUnit,
    settings,
  ]);

  return (
    <DiabetesSettingsContext.Provider value={value}>
      {children}
    </DiabetesSettingsContext.Provider>
  );
}
