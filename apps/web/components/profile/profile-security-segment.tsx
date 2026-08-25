'use client';

import type { PasskeySummary } from '@diabetes-universe/identity';
import Link from 'next/link';
import { useMemo } from 'react';

import { PasskeyManager } from '../auth/passkey-manager';
import { useLocalization } from '../../lib/platform/react/use-localization';
import {
  profileCardClassName,
  profileInteractiveLinkClassName,
} from './profile-surface-styles';
import { resolveProfileSecurityLabels } from './profile-security-labels';

export function ProfileSecuritySegment({
  passkeyEnabled,
  passkeys,
}: {
  readonly passkeyEnabled: boolean;
  readonly passkeys: readonly PasskeySummary[];
}) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveProfileSecurityLabels(localization),
    [localization],
  );

  return (
    <div className="space-y-4">
      {passkeyEnabled ? (
        <PasskeyManager passkeys={passkeys} />
      ) : (
        <section className={`${profileCardClassName} space-y-2 p-6`}>
          <h2 className="text-text-primary text-lg font-bold">
            {labels.passkeysUnavailable.title}
          </h2>
          <p className="text-text-secondary text-sm">
            {labels.passkeysUnavailable.description}
          </p>
        </section>
      )}

      <Link
        className={profileInteractiveLinkClassName}
        href="/account/security/sessions"
      >
        <span className="min-w-0">
          <span className="text-text-primary block text-sm font-semibold">
            {labels.sessionsLink.title}
          </span>
          <span className="text-text-secondary mt-0.5 block text-xs">
            {labels.sessionsLink.subtitle}
          </span>
        </span>
        <span aria-hidden="true" className="text-text-secondary">
          →
        </span>
      </Link>
    </div>
  );
}
