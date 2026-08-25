'use client';

import type { AuthenticatedPrincipal } from '@diabetes-universe/identity';
import { useMemo, useState } from 'react';

import { ProfileLogoutButton } from './profile-shell';
import { resolveProfileLabels } from './profile-labels';
import { ProfileMenu } from './profile-menu';
import { ProfileUserCard } from './profile-user-card';
import { createProfileUserCardModel } from './profile-user-model';
import { useLocalization } from '../../lib/platform/react/use-localization';

export function ProfileProfileSegment({
  principal,
}: {
  readonly principal: AuthenticatedPrincipal;
}) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveProfileLabels(localization),
    [localization],
  );
  const [avatarUrlOverride, setAvatarUrlOverride] = useState<
    string | null | undefined
  >(undefined);
  const userCardModel = useMemo(
    () =>
      createProfileUserCardModel(
        {
          ...principal,
          avatarUrl: avatarUrlOverride ?? principal.avatarUrl,
        },
        labels.userCard,
        localization.localeContext.locale,
      ),
    [
      avatarUrlOverride,
      labels.userCard,
      localization.localeContext.locale,
      principal,
    ],
  );

  return (
    <div className="space-y-5">
      <ProfileUserCard
        labels={labels.userCard}
        model={userCardModel}
        onAvatarChange={setAvatarUrlOverride}
      />
      <ProfileMenu labels={labels} />
      <ProfileLogoutButton label={labels.logout} />
    </div>
  );
}
