import { execFileSync } from 'node:child_process';

export const BASELINE_RESOLUTION = {
  BASELINE_FILE_ABSENT: 'BASELINE_FILE_ABSENT',
  BASELINE_AVAILABLE: 'BASELINE_AVAILABLE',
  BASELINE_UNAVAILABLE: 'BASELINE_UNAVAILABLE',
};

function runGitAllowFailure(args, cwd) {
  try {
    const stdout = execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true, stdout: stdout.trim(), stderr: '' };
  } catch (error) {
    const stderr =
      error && typeof error === 'object' && 'stderr' in error
        ? String(error.stderr)
        : '';
    return { ok: false, stdout: '', stderr };
  }
}

function commitExists(commitRef, cwd) {
  const result = runGitAllowFailure(
    ['rev-parse', '--verify', `${commitRef}^{commit}`],
    cwd,
  );
  return result.ok;
}

function isBaselineFileAbsentError(stderr) {
  const normalized = stderr.toLowerCase();
  return (
    normalized.includes('does not exist in') ||
    normalized.includes('exists on disk, but not in') ||
    (normalized.includes('pathspec') &&
      normalized.includes('did not match any file'))
  );
}

export function resolveOpenApiBaselineFromCommit({
  commitRef,
  specRelativePath,
  cwd,
}) {
  if (!commitRef?.trim()) {
    return {
      status: BASELINE_RESOLUTION.BASELINE_UNAVAILABLE,
      reason: 'No base commit reference was provided.',
    };
  }

  if (!commitExists(commitRef, cwd)) {
    return {
      status: BASELINE_RESOLUTION.BASELINE_UNAVAILABLE,
      reason: `Base commit "${commitRef}" could not be resolved.`,
    };
  }

  const showResult = runGitAllowFailure(
    ['show', `${commitRef}:${specRelativePath}`],
    cwd,
  );

  if (showResult.ok) {
    return {
      status: BASELINE_RESOLUTION.BASELINE_AVAILABLE,
      baseRef: commitRef,
      source: showResult.stdout,
    };
  }

  if (isBaselineFileAbsentError(showResult.stderr)) {
    return {
      status: BASELINE_RESOLUTION.BASELINE_FILE_ABSENT,
      baseRef: commitRef,
    };
  }

  return {
    status: BASELINE_RESOLUTION.BASELINE_UNAVAILABLE,
    reason: `Failed to load OpenAPI baseline from ${commitRef}: ${showResult.stderr.trim()}`,
  };
}

export function resolveOpenApiBaseline({
  cwd,
  specRelativePath,
  explicitBaseSha,
  fallbackRefs = [],
}) {
  if (explicitBaseSha?.trim()) {
    return resolveOpenApiBaselineFromCommit({
      commitRef: explicitBaseSha.trim(),
      specRelativePath,
      cwd,
    });
  }

  for (const candidate of fallbackRefs.filter(Boolean)) {
    const resolution = resolveOpenApiBaselineFromCommit({
      commitRef: candidate,
      specRelativePath,
      cwd,
    });

    if (resolution.status !== BASELINE_RESOLUTION.BASELINE_UNAVAILABLE) {
      return resolution;
    }
  }

  return {
    status: BASELINE_RESOLUTION.BASELINE_UNAVAILABLE,
    reason:
      'No OpenAPI baseline could be resolved from configured fallback refs.',
  };
}
