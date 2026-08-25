import type { ProfileUserCardModel } from './profile-user-model';

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
    <section className="profile-card relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-5 shadow-[0_18px_40px_rgba(2,6,23,0.35)] backdrop-blur-md dark:bg-slate-900/75">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(45,212,191,0.12),transparent_42%),radial-gradient(circle_at_100%_0%,rgba(167,139,250,0.14),transparent_38%)]"
      />
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
