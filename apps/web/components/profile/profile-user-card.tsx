import type { ProfileUserCardModel } from './profile-user-model';
import {
  profileUserCardAccentClassName,
  profileUserCardClassName,
} from './profile-surface-styles';

export interface ProfileUserCardLabels {
  readonly avatarLabel: string;
  readonly emailLabel: string;
}

export function ProfileUserCard({
  labels,
  model,
}: {
  readonly labels: ProfileUserCardLabels;
  readonly model: ProfileUserCardModel;
}) {
  return (
    <section className={profileUserCardClassName}>
      <div aria-hidden="true" className={profileUserCardAccentClassName} />
      <div className="relative flex items-center gap-4">
        <div
          aria-label={labels.avatarLabel}
          className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-400/90 via-cyan-400/85 to-violet-500/80 text-lg font-bold text-white shadow-[0_10px_24px_rgba(6,182,212,0.25)]"
          role="img"
        >
          {model.avatarInitials ? (
            <span aria-hidden="true">{model.avatarInitials}</span>
          ) : (
            <span aria-hidden="true" className="text-2xl">
              ◦
            </span>
          )}
        </div>
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
