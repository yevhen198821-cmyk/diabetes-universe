import { resolveAuthEnvironment } from '@diabetes-universe/identity';

function readHeaderValue(
  headers: Headers,
  name:
    'host' | 'origin' | 'referer' | 'x-forwarded-host' | 'x-forwarded-proto',
): string | null {
  const value = headers.get(name)?.trim();
  return value ? value : null;
}

export function normalizeAuthRequestHeaders(headers: Headers): Headers {
  const normalized = new Headers(headers);
  const forwardedHost = readHeaderValue(normalized, 'x-forwarded-host');
  const forwardedProto = readHeaderValue(normalized, 'x-forwarded-proto');
  const host = readHeaderValue(normalized, 'host') ?? forwardedHost;

  if (host && !normalized.has('host')) {
    normalized.set('host', host);
  }

  if (
    !readHeaderValue(normalized, 'origin') &&
    !readHeaderValue(normalized, 'referer')
  ) {
    const protocol =
      forwardedProto === 'http' || forwardedProto === 'https'
        ? forwardedProto
        : resolveAuthEnvironment().baseUrl.startsWith('http://')
          ? 'http'
          : 'https';

    if (host) {
      normalized.set('origin', `${protocol}://${host}`);
    }
  }

  return normalized;
}
