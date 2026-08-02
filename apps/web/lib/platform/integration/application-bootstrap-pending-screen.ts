'use client';

import { createElement } from 'react';

/**
 * Neutral bootstrap screen shown while the client realm assembles PlatformRuntime.
 *
 * Does not render product routes or time-dependent presentation values.
 */
export function ApplicationBootstrapPendingScreen() {
  return createElement('div', {
    'aria-busy': 'true',
    'data-testid': 'application-bootstrap-pending',
    role: 'status',
  });
}
