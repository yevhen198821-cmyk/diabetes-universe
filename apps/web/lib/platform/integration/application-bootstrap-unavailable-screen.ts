'use client';

import { createElement } from 'react';

/**
 * Neutral unavailable state when browser IANA time zone cannot be resolved.
 */
export function ApplicationBootstrapUnavailableScreen() {
  return createElement(
    'div',
    {
      'data-testid': 'application-bootstrap-unavailable',
      role: 'status',
    },
    'Presentation setup is required before the application can load.',
  );
}
