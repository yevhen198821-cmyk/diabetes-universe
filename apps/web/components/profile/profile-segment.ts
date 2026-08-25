export type ProfileSegment = 'profile' | 'security' | 'settings';

export function resolveProfileSegmentFromPathname(
  pathname: string,
): ProfileSegment {
  if (pathname === '/account/settings') {
    return 'settings';
  }

  if (
    pathname === '/account/security' ||
    pathname.startsWith('/account/security/')
  ) {
    return 'security';
  }

  return 'profile';
}

export const PROFILE_SEGMENT_PATHS: Readonly<Record<ProfileSegment, string>> = {
  profile: '/account',
  security: '/account/security',
  settings: '/account/settings',
};
