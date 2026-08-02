'use client';

import { createElement } from 'react';

/**
 * Safe generic infrastructure error surface for runtime assembly failures.
 */
export function ApplicationBootstrapErrorScreen() {
  return createElement(
    'div',
    {
      'data-testid': 'application-bootstrap-error',
      role: 'alert',
    },
    'The application is temporarily unavailable. Please try again later.',
  );
}
