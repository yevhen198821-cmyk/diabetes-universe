'use client';

import type { GlucoseDisplayUnit } from '@diabetes-universe/medical-domain';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  fetchDiabetesSettings,
  patchDiabetesSettings,
} from '../client/diabetes-settings-client';
import {
  DiabetesSettingsClientError,
  type DiabetesSettingsResource,
} from '../client/diabetes-settings-types';
import { interpretDiabetesSettingsLoadFailure } from '../client/parse-diabetes-settings-resource';

export type DiabetesSettingsLoadState = 'loading' | 'ready' | 'error';

export interface DiabetesSettingsContextValue {
  readonly error: DiabetesSettingsClientError | null;
  readonly glucoseDisplayUnit: GlucoseDisplayUnit | null;
  readonly isUnconfigured: boolean;
  readonly loadState: DiabetesSettingsLoadState;
  readonly patchGlucoseDisplayUnit: (
    unit: GlucoseDisplayUnit,
  ) => Promise<DiabetesSettingsResource>;
  readonly refresh: () => Promise<void>;
  readonly selectGlucoseDisplayUnit: (
    unit: GlucoseDisplayUnit,
  ) => Promise<void>;
  readonly settings: DiabetesSettingsResource | null;
  readonly updateSettingsFromMutation: (
    nextSettings: DiabetesSettingsResource,
  ) => void;
}

const DiabetesSettingsContext =
  createContext<DiabetesSettingsContextValue | null>(null);

export { DiabetesSettingsContext };

interface DiabetesSettingsProviderProps {
  readonly children: ReactNode;
}

export function DiabetesSettingsProvider({
  children,
}: DiabetesSettingsProviderProps) {
  const [loadState, setLoadState] =
    useState<DiabetesSettingsLoadState>('loading');
  const [settings, setSettings] = useState<DiabetesSettingsResource | null>(
    null,
  );
  const [error, setError] = useState<DiabetesSettingsClientError | null>(null);
  const [sessionDisplayUnit, setSessionDisplayUnit] =
    useState<GlucoseDisplayUnit | null>(null);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoadState('loading');
    setError(null);

    try {
      const nextSettings = await fetchDiabetesSettings();

      if (requestId !== requestIdRef.current) {
        return;
      }

      setSettings(nextSettings);
      setError(null);
      setLoadState('ready');
    } catch (caughtError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const interpreted = interpretDiabetesSettingsLoadFailure(caughtError);
      if (interpreted.type === 'unconfigured') {
        setSettings(null);
        setError(null);
        setLoadState('ready');
        return;
      }

      setError(interpreted.error);
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    void refresh();

    return () => {
      requestIdRef.current += 1;
    };
  }, [refresh]);

  const updateSettingsFromMutation = useCallback(
    (nextSettings: DiabetesSettingsResource) => {
      setSettings(nextSettings);
      setError(null);
      setLoadState('ready');
    },
    [],
  );

  const patchGlucoseDisplayUnit = useCallback(
    async (unit: GlucoseDisplayUnit) => {
      if (!settings) {
        throw new DiabetesSettingsClientError(
          'server',
          'Diabetes settings are not loaded.',
        );
      }

      const updated = await patchDiabetesSettings(settings.revision, {
        glucoseDisplayUnit: unit,
      });
      setSettings(updated);
      setSessionDisplayUnit(null);
      setError(null);
      setLoadState('ready');
      return updated;
    },
    [settings],
  );

  const selectGlucoseDisplayUnit = useCallback(
    async (unit: GlucoseDisplayUnit) => {
      if (settings) {
        await patchGlucoseDisplayUnit(unit);
        return;
      }

      setSessionDisplayUnit(unit);
      setError(null);
      setLoadState('ready');
    },
    [patchGlucoseDisplayUnit, settings],
  );

  const resolvedDisplayUnit =
    settings?.glucoseDisplayUnit ?? sessionDisplayUnit;

  const value = useMemo<DiabetesSettingsContextValue>(
    () => ({
      error,
      glucoseDisplayUnit: resolvedDisplayUnit,
      isUnconfigured: loadState === 'ready' && resolvedDisplayUnit == null,
      loadState,
      patchGlucoseDisplayUnit,
      refresh,
      selectGlucoseDisplayUnit,
      settings,
      updateSettingsFromMutation,
    }),
    [
      error,
      loadState,
      patchGlucoseDisplayUnit,
      refresh,
      resolvedDisplayUnit,
      selectGlucoseDisplayUnit,
      settings,
      updateSettingsFromMutation,
    ],
  );

  return (
    <DiabetesSettingsContext.Provider value={value}>
      {children}
    </DiabetesSettingsContext.Provider>
  );
}

export function useDiabetesSettings(): DiabetesSettingsContextValue {
  const context = useContext(DiabetesSettingsContext);

  if (!context) {
    throw new Error(
      'useDiabetesSettings must be used within DiabetesSettingsProvider',
    );
  }

  return context;
}
