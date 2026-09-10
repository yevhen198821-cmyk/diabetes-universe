export const MEDICAL_API_RATE_LIMIT_WINDOWS_SQL = `
CREATE SCHEMA IF NOT EXISTS medical_ops;

CREATE TABLE IF NOT EXISTS medical_ops.rate_limit_windows (
  bucket_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  PRIMARY KEY (bucket_key, window_start)
);
`;

export interface MedicalApiRateLimitSqlClient {
  unsafe(statement: string): Promise<unknown>;
  <T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
}

export function createPostgresMedicalApiRateLimitCounterStore(options: {
  readonly sql: MedicalApiRateLimitSqlClient;
}) {
  return {
    async increment(bucketKey: string, windowStartEpochSeconds: number) {
      const rows = await options.sql<
        ReadonlyArray<{ readonly request_count: number }>
      >`
        INSERT INTO medical_ops.rate_limit_windows (
          bucket_key,
          window_start,
          request_count
        )
        VALUES (
          ${bucketKey},
          to_timestamp(${windowStartEpochSeconds}),
          1
        )
        ON CONFLICT (bucket_key, window_start)
        DO UPDATE SET request_count =
          medical_ops.rate_limit_windows.request_count + 1
        RETURNING request_count
      `;

      const count = rows[0]?.request_count;
      if (typeof count !== 'number') {
        throw new Error('Rate-limit increment returned no count.');
      }

      return count;
    },
  };
}

export async function createPostgresMedicalApiRateLimitSql(
  connectionString: string,
): Promise<MedicalApiRateLimitSqlClient> {
  const postgres = (await import('postgres')).default;
  return postgres(connectionString, {
    max: 4,
    prepare: false,
  }) as MedicalApiRateLimitSqlClient;
}
