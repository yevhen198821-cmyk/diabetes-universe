import webPackage from '../../package.json' with { type: 'json' };

import { resolveDisplayAppVersion } from './resolve-display-app-version';

export interface AppBuildMetadata {
  readonly buildLabel: string | null;
  readonly version: string | null;
}

function resolveBuildLabel(): string | null {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim();

  if (!commitSha || commitSha.length < 7) {
    return null;
  }

  return commitSha.slice(0, 7);
}

export function resolveAppBuildMetadata(): AppBuildMetadata {
  const rawVersion =
    process.env.NEXT_PUBLIC_APP_VERSION?.trim() || webPackage.version;

  return {
    buildLabel: resolveBuildLabel(),
    version: resolveDisplayAppVersion(rawVersion),
  };
}
