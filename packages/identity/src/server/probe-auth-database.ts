import { sql } from 'drizzle-orm';

import type { AuthEnvironment } from '../config/auth-environment';
import { createAuthDatabase } from './database/create-auth-database';

export interface AuthDatabaseProbeResult {
  readonly connectionOk: boolean;
  readonly authSchemaAccessible: boolean;
  readonly errorType: string | null;
  readonly errorMessage: string | null;
}

export async function probeAuthDatabaseHealth(
  environment: AuthEnvironment,
): Promise<AuthDatabaseProbeResult> {
  try {
    const authDatabase = await createAuthDatabase(environment);
    await authDatabase.execute(sql`select 1`);

    const tableCheck = await authDatabase.execute(sql`
      select to_regclass('public.session') as session_table,
             to_regclass('public.verification') as verification_table
    `);

    const rows = tableCheck as unknown as Array<{
      session_table: string | null;
      verification_table: string | null;
    }>;
    const row = rows[0];

    return {
      connectionOk: true,
      authSchemaAccessible: Boolean(row?.session_table && row?.verification_table),
      errorType: null,
      errorMessage: null,
    };
  } catch (error) {
    return {
      connectionOk: false,
      authSchemaAccessible: false,
      errorType: error instanceof Error ? error.name : 'DatabaseProbeError',
      errorMessage:
        error instanceof Error ? error.message : 'Database probe failed.',
    };
  }
}
