'use client';

import type { GlucoseDisplayUnit } from '@diabetes-universe/medical-domain';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

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
  const [internalLoadState, setInternalLoadState] =
    useState<DiabetesSettingsLoadState>(loadState);
  const [internalError, setInternalError] =
    useState<DiabetesSettingsClientError | null>(error);

  useEffect(() => {
    setInternalLoadState(loadState);
    setInternalError(error);
  }, [error, loadState]);

  const value = useMemo<DiabetesSettingsContextValue>(() => {
    const resolvedSettings =
      settings === undefined
        ? createTestSettings(glucoseDisplayUnit)
        : settings;
    const resolvedLoadState = internalLoadState;
    const resolvedError = resolvedLoadState === 'error' ? internalError : null;
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
        setInternalLoadState('loading');
        setInternalError(null);

        try {
          await onRefresh();
          setInternalLoadState('ready');
        } catch (caughtError) {
          setInternalError(
            caughtError instanceof DiabetesSettingsClientError
              ? caughtError
              : new DiabetesSettingsClientError(
                  'network',
                  'Network request failed.',
                ),
          );
          setInternalLoadState('error');
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
    glucoseDisplayUnit,
    internalError,
    internalLoadState,
    onRefresh,
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
