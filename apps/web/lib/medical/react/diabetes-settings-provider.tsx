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
  type DiabetesSettingsPatch,
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
  readonly patchSettings: (
    patch: DiabetesSettingsPatch,
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
  const settingsRef = useRef<DiabetesSettingsResource | null>(null);
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  const applyLoadResult = useCallback(
    (requestId: number, result: Promise<DiabetesSettingsResource>) => {
      return result
        .then((nextSettings) => {
          if (requestId !== requestIdRef.current) {
            return;
          }

          settingsRef.current = nextSettings;
          setSettings(nextSettings);
          setError(null);
          setLoadState('ready');
        })
        .catch((caughtError: unknown) => {
          if (requestId !== requestIdRef.current) {
            return;
          }

          const interpreted = interpretDiabetesSettingsLoadFailure(caughtError);
          if (interpreted.type === 'unconfigured') {
            settingsRef.current = null;
            setSettings(null);
            setError(null);
            setLoadState('ready');
            return;
          }

          setError(interpreted.error);
          setLoadState('error');
        });
    },
    [],
  );

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoadState('loading');
    setError(null);
    await applyLoadResult(requestId, fetchDiabetesSettings());
  }, [applyLoadResult]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    void applyLoadResult(requestId, fetchDiabetesSettings());

    return () => {
      requestIdRef.current += 1;
    };
  }, [applyLoadResult]);

  const updateSettingsFromMutation = useCallback(
    (nextSettings: DiabetesSettingsResource) => {
      // A GET started before this write must not replace its new revision.
      requestIdRef.current += 1;
      settingsRef.current = nextSettings;
      setSettings(nextSettings);
      setError(null);
      setLoadState('ready');
    },
    [],
  );

  const patchSettings = useCallback(
    (patch: DiabetesSettingsPatch) => {
      const expectedSubjectId = settingsRef.current?.subjectId;
      const result = mutationQueueRef.current.then(async () => {
        const current = settingsRef.current;
        if (!current) {
          throw new DiabetesSettingsClientError(
            'server',
            'Diabetes settings are not loaded.',
          );
        }

        if (current.subjectId !== expectedSubjectId) {
          throw new DiabetesSettingsClientError(
            'unauthorized',
            'The signed-in account changed.',
          );
        }

        const updated = await patchDiabetesSettings(current.revision, patch);
        if (settingsRef.current?.subjectId !== expectedSubjectId) {
          throw new DiabetesSettingsClientError(
            'unauthorized',
            'The signed-in account changed.',
          );
        }
        updateSettingsFromMutation(updated);
        return updated;
      });

      // Keep subsequent edits usable after a failed write; never retry a
      // genuine remote revision conflict automatically.
      mutationQueueRef.current = result.then(
        () => {},
        () => {},
      );
      return result;
    },
    [updateSettingsFromMutation],
  );

  const patchGlucoseDisplayUnit = useCallback(
    async (unit: GlucoseDisplayUnit) => {
      const updated = await patchSettings({ glucoseDisplayUnit: unit });
      setSessionDisplayUnit(null);
      return updated;
    },
    [patchSettings],
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
      patchSettings,
      refresh,
      selectGlucoseDisplayUnit,
      settings,
      updateSettingsFromMutation,
    }),
    [
      error,
      loadState,
      patchGlucoseDisplayUnit,
      patchSettings,
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
