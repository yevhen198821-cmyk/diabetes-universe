import type { AccountSessionClientKind } from '../contracts/session-management-contracts';

export interface UserAgentLabel {
  readonly clientLabel: string;
  readonly clientKind: AccountSessionClientKind;
}

export function mapUserAgentLabel(
  userAgent: string | null | undefined,
): UserAgentLabel {
  const normalizedUserAgent = userAgent?.trim() ?? '';

  if (!normalizedUserAgent) {
    return {
      clientLabel: 'Unknown client',
      clientKind: 'unknown',
    };
  }

  const lowerUserAgent = normalizedUserAgent.toLowerCase();
  const isEdge =
    lowerUserAgent.includes('edg/') || lowerUserAgent.includes('edge/');
  const isFirefox = lowerUserAgent.includes('firefox/');
  const isChrome = lowerUserAgent.includes('chrome/') && !isEdge && !isFirefox;
  const isSafari =
    lowerUserAgent.includes('safari/') && !isChrome && !isEdge && !isFirefox;

  const isAndroid = lowerUserAgent.includes('android');
  const isIPhone =
    lowerUserAgent.includes('iphone') ||
    lowerUserAgent.includes('ipad') ||
    lowerUserAgent.includes('ipod');
  const isMobile =
    isAndroid ||
    isIPhone ||
    lowerUserAgent.includes('mobile') ||
    lowerUserAgent.includes('mobi');

  const isMac =
    lowerUserAgent.includes('mac os x') || lowerUserAgent.includes('macintosh');
  const isWindows = lowerUserAgent.includes('windows');
  const isLinux = lowerUserAgent.includes('linux') && !isAndroid;

  let browserName = 'Unknown browser';

  if (isEdge) {
    browserName = 'Edge';
  } else if (isFirefox) {
    browserName = 'Firefox';
  } else if (isChrome) {
    browserName = 'Chrome';
  } else if (isSafari) {
    browserName = 'Safari';
  } else if (isAndroid) {
    browserName = 'Android browser';
  } else if (isMobile) {
    browserName = 'Mobile browser';
  } else if (isMac || isWindows || isLinux) {
    browserName = 'Desktop browser';
  }

  let platformLabel = '';

  if (lowerUserAgent.includes('iphone') || lowerUserAgent.includes('ipod')) {
    platformLabel = 'iPhone';
  } else if (lowerUserAgent.includes('ipad')) {
    platformLabel = 'iPad';
  } else if (isAndroid) {
    platformLabel = 'Android';
  } else if (isMac) {
    platformLabel = 'macOS';
  } else if (isWindows) {
    platformLabel = 'Windows';
  } else if (isLinux) {
    platformLabel = 'Linux';
  }

  const clientLabel = platformLabel
    ? `${browserName} · ${platformLabel}`
    : browserName;

  let clientKind: AccountSessionClientKind = 'unknown';

  if (isMobile) {
    clientKind = 'mobile';
  } else if (isMac || isWindows || isLinux) {
    clientKind = 'desktop';
  } else if (browserName !== 'Unknown browser') {
    clientKind = 'browser';
  }

  return {
    clientLabel,
    clientKind,
  };
}
