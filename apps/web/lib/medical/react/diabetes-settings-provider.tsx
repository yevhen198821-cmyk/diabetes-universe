'use client';

import type { GlucoseDisplayUnit } from '@diabetes-universe/medical-domain';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

  const refresh = useCallback(async () => {
    try {
      const nextSettings = await fetchDiabetesSettings();
      setSettings(nextSettings);
      setError(null);
      setLoadState('ready');
    } catch (caughtError) {
      if (
        caughtError instanceof DiabetesSettingsClientError &&
        caughtError.kind === 'unauthorized'
      ) {
        setSettings(null);
        setError(null);
        setLoadState('ready');
        return;
      }

      setError(
        caughtError instanceof DiabetesSettingsClientError
          ? caughtError
          : new DiabetesSettingsClientError(
              'network',
              'Network request failed.',
            ),
      );
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const nextSettings = await fetchDiabetesSettings();

        if (cancelled) {
          return;
        }

        setSettings(nextSettings);
        setError(null);
        setLoadState('ready');
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        if (
          caughtError instanceof DiabetesSettingsClientError &&
          caughtError.kind === 'unauthorized'
        ) {
          setSettings(null);
          setError(null);
          setLoadState('ready');
          return;
        }

        setError(
          caughtError instanceof DiabetesSettingsClientError
            ? caughtError
            : new DiabetesSettingsClientError(
                'network',
                'Network request failed.',
              ),
        );
        setLoadState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
      setError(null);
      setLoadState('ready');
      return updated;
    },
    [settings],
  );

  const value = useMemo<DiabetesSettingsContextValue>(
    () => ({
      error,
      glucoseDisplayUnit: settings?.glucoseDisplayUnit ?? null,
      isUnconfigured:
        loadState === 'ready' && settings?.glucoseDisplayUnit == null,
      loadState,
      patchGlucoseDisplayUnit,
      refresh,
      settings,
      updateSettingsFromMutation,
    }),
    [
      error,
      loadState,
      patchGlucoseDisplayUnit,
      refresh,
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
