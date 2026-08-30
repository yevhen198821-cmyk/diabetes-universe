'use client';

import type { GlucoseDisplayUnit } from '@diabetes-universe/medical-domain';
import { useMemo, type ReactNode } from 'react';

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
  settings = null,
}: TestDiabetesSettingsProviderProps) {
  const value = useMemo<DiabetesSettingsContextValue>(() => {
    const resolvedSettings = settings ?? createTestSettings(glucoseDisplayUnit);
    const resolvedLoadState = loadState;
    const resolvedError = resolvedLoadState === 'error' ? error : null;
    const resolvedGlucoseDisplayUnit =
      resolvedLoadState === 'ready'
        ? resolvedSettings.glucoseDisplayUnit
        : null;

    return {
      error: resolvedError,
      glucoseDisplayUnit: resolvedGlucoseDisplayUnit,
      isUnconfigured:
        resolvedLoadState === 'ready' &&
        resolvedSettings.glucoseDisplayUnit == null,
      loadState: resolvedLoadState,
      patchGlucoseDisplayUnit: async (unit) => ({
        ...resolvedSettings,
        glucoseDisplayUnit: unit,
      }),
      refresh: onRefresh,
      settings: resolvedLoadState === 'ready' ? resolvedSettings : null,
      updateSettingsFromMutation: () => {},
    };
  }, [error, glucoseDisplayUnit, loadState, onRefresh, settings]);

  return (
    <DiabetesSettingsContext.Provider value={value}>
      {children}
    </DiabetesSettingsContext.Provider>
  );
}
