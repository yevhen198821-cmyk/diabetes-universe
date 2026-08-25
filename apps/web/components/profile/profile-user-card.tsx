import type { ProfileUserCardModel } from './profile-user-model';
import {
  profileUserCardAccentClassName,
  profileUserCardClassName,
} from './profile-surface-styles';
import {
  ProfileAvatarEditor,
  type ProfileAvatarEditorLabels,
} from './profile-avatar-editor';

export interface ProfileUserCardLabels {
  readonly avatar: ProfileAvatarEditorLabels;
  readonly emailLabel: string;
}

export function ProfileUserCard({
  labels,
  model,
  onAvatarChange,
}: {
  readonly labels: ProfileUserCardLabels;
  readonly model: ProfileUserCardModel;
  readonly onAvatarChange?: (avatarUrl: string | null) => void;
}) {
  return (
    <section className={profileUserCardClassName}>
      <div aria-hidden="true" className={profileUserCardAccentClassName} />
      <div className="relative flex items-center gap-4">
        <ProfileAvatarEditor
          avatarInitials={model.avatarInitials}
          avatarUrl={model.avatarUrl}
          labels={labels.avatar}
          onAvatarChange={onAvatarChange ?? (() => undefined)}
        />
        <div className="min-w-0">
          <h2 className="text-text-primary truncate text-xl font-bold tracking-tight">
            {model.displayName}
          </h2>
          {model.showEmail ? (
            <p className="text-text-secondary mt-1 truncate text-sm">
              <span className="sr-only">{labels.emailLabel}: </span>
              {model.email}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
