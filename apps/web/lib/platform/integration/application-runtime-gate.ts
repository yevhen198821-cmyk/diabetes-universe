'use client';

import type { PlatformRuntime } from '@diabetes-universe/platform';
import { createElement, useEffect, useState, type ReactNode } from 'react';

import { AppProviders } from '../../../app/providers';
import { PlatformProvider } from '../react/platform-provider';

import { ApplicationBootstrapErrorScreen } from './application-bootstrap-error-screen';
import { ApplicationBootstrapPendingScreen } from './application-bootstrap-pending-screen';
import { ApplicationBootstrapUnavailableScreen } from './application-bootstrap-unavailable-screen';
import type { ApplicationPlatformBootstrap } from './application-platform-bootstrap';
import {
  APPLICATION_PLATFORM_READY_STATUS,
  APPLICATION_PLATFORM_STATUS_ATTRIBUTE,
} from './application-platform-ready-marker';
import { createClientPlatformRuntimeFromBootstrap } from './create-client-platform-runtime-from-bootstrap';
import type { CreateClientPlatformRuntimeFromBootstrapResult } from './create-client-platform-runtime-from-bootstrap';

type ApplicationRuntimeGateState =
  | { readonly status: 'pending' }
  | { readonly status: 'ready'; readonly runtime: PlatformRuntime }
  | { readonly status: 'time-zone-unavailable' }
  | { readonly status: 'error' };

export type ApplicationRuntimeBootstrapper = (
  bootstrap: ApplicationPlatformBootstrap,
) => Promise<CreateClientPlatformRuntimeFromBootstrapResult>;

export interface ApplicationRuntimeGateProps {
  readonly bootstrap: ApplicationPlatformBootstrap;
  readonly children: ReactNode;
  readonly runtimeBootstrapper?: ApplicationRuntimeBootstrapper;
}

function ReadyApplicationTree({
  runtime,
  children,
}: {
  readonly runtime: PlatformRuntime;
  readonly children: ReactNode;
}) {
  return createElement(
    'div',
    {
      [APPLICATION_PLATFORM_STATUS_ATTRIBUTE]:
        APPLICATION_PLATFORM_READY_STATUS,
      style: { display: 'contents' },
    },
    /* eslint-disable react/no-children-prop -- PlatformProviderProps requires children in props for typed createElement */
    createElement(PlatformProvider, {
      runtime,
      children: createElement(AppProviders, null, children),
    }),
    /* eslint-enable react/no-children-prop */
  );
}

/**
 * Client Application Runtime Gate (ADR-0013).
 *
 * Owns client-realm runtime assembly and mounts the product tree only once the
 * runtime is ready.
 */
export function ApplicationRuntimeGate({
  bootstrap,
  children,
  runtimeBootstrapper = createClientPlatformRuntimeFromBootstrap,
}: ApplicationRuntimeGateProps) {
  const [gateState, setGateState] = useState<ApplicationRuntimeGateState>({
    status: 'pending',
  });

  useEffect(() => {
    let cancelled = false;

    void runtimeBootstrapper(bootstrap)
      .then((result) => {
        if (cancelled) {
          return;
        }

        if (result.status === 'time-zone-unavailable') {
          setGateState({ status: 'time-zone-unavailable' });
          return;
        }

        setGateState({ status: 'ready', runtime: result.runtime });
      })
      .catch(() => {
        if (!cancelled) {
          setGateState({ status: 'error' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bootstrap, runtimeBootstrapper]);

  if (gateState.status === 'pending') {
    return createElement(ApplicationBootstrapPendingScreen);
  }

  if (gateState.status === 'time-zone-unavailable') {
    return createElement(ApplicationBootstrapUnavailableScreen);
  }

  if (gateState.status === 'error') {
    return createElement(ApplicationBootstrapErrorScreen);
  }

  /* eslint-disable react/no-children-prop -- ReadyApplicationTree props require children for typed createElement */
  return createElement(ReadyApplicationTree, {
    runtime: gateState.runtime,
    children,
  });
  /* eslint-enable react/no-children-prop */
}
