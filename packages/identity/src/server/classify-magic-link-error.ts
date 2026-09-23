/** Diagnostic fields safe for logs. Never return exception messages or request data. */
export function classifyMagicLinkError(error: unknown): {
  readonly category: string;
  readonly code?: string;
  readonly status?: number;
} {
  const value = error instanceof Error ? error : null;
  const cause = value?.cause instanceof Error ? value.cause : null;
  const rawCode =
    value && 'code' in value ? value.code : cause && 'code' in cause ? cause.code : null;
  const code =
    typeof rawCode === 'string' &&
    /^(?:42P01|42703|28P01|42501|23505|08006|08001|57P01|ENOTFOUND|ECONNREFUSED|ETIMEDOUT)$/.test(rawCode)
      ? rawCode
      : undefined;
  const rawStatus = value && 'status' in value ? value.status : null;
  const status =
    typeof rawStatus === 'number' &&
    Number.isInteger(rawStatus) &&
    rawStatus >= 400 &&
    rawStatus <= 599
      ? rawStatus
      : undefined;
  const message = `${value?.message ?? ''} ${cause?.message ?? ''}`;

  let category = 'request_error';
  if (/auth email delivery failed/i.test(message)) {
    category = 'email_delivery';
  } else if (/relation .* does not exist|column .* does not exist|42P01|42703/i.test(message)) {
    category = 'database_schema';
  } else if (/password authentication failed|authentication failed for user|28P01/i.test(message)) {
    category = 'database_credentials';
  } else if (/connection refused|connection terminated|fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(message)) {
    category = 'connection';
  } else if (/invalid origin|untrusted origin|invalid callback|csrf/i.test(message)) {
    category = 'auth_origin';
  } else if (/rate limit|too many requests/i.test(message)) {
    category = 'rate_limit';
  } else if (value?.name === 'PostgresError') {
    category = 'database_error';
  } else if (value?.name === 'APIError') {
    category = 'auth_api_error';
  }

  return { category, ...(code ? { code } : {}), ...(status ? { status } : {}) };
}
