import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/database/medical-schema.ts',
  out: './drizzle',
  dbCredentials: {
    url:
      process.env.MEDICAL_MIGRATOR_DATABASE_URL ??
      process.env.MEDICAL_DATABASE_URL ??
      'postgres://localhost:5432/diabetes_universe_medical',
  },
  schemaFilter: ['medical'],
});
