import { sql } from 'drizzle-orm';

import {
  DIABETES_SETTINGS_AUDIT_ACTIONS,
  DIABETES_SETTINGS_AUDIT_RESOURCE_TYPES,
  InvalidRevisionPreconditionError,
  InvalidRevisionTokenError,
  MedicalRevisionConflictError,
  type DiabetesSettings,
  type GlucoseTargetProfile,
  type GlucoseTargetRange,
} from '@diabetes-universe/medical-domain';
import type { MedicalEnvironment } from '@diabetes-universe/medical-persistence/server';
import {
  createDiabetesSettingsRepository,
  createGlucoseTargetProfileRepository,
  createMedicalAuditRepository,
  createRevisionTokenService,
  InvalidRevisionTokenError as InvalidPersistenceRevisionTokenError,
  MalformedRevisionTokenError,
  type DiabetesSettingsPatch,
  type MedicalDatabase,
  type RevisionTokenService,
} from '@diabetes-universe/medical-persistence/server';

import type { AuthorizationScope } from '../types/authorization-scope';

const SETTINGS_BOOTSTRAP_PREFIX = 'bootstrap:diabetes-settings:';
const TARGET_BOOTSTRAP_PREFIX = 'bootstrap:glucose-target-profile:';

export interface DiabetesSettingsView {
  readonly configured: boolean;
  readonly settings: DiabetesSettings;
  readonly etagToken: string;
}

export interface GlucoseTargetProfileView {
  readonly configured: boolean;
  readonly profile: GlucoseTargetProfile;
  readonly etagToken: string;
}

export interface PatchDiabetesSettingsInput {
  readonly scope: AuthorizationScope;
  readonly ifMatch: string | undefined;
  readonly patch: DiabetesSettingsPatch;
}

export interface PutGlucoseTargetProfileInput {
  readonly scope: AuthorizationScope;
  readonly ifMatch: string | undefined;
  readonly range: GlucoseTargetRange;
}

export interface ClearGlucoseTargetProfileInput {
  readonly scope: AuthorizationScope;
  readonly ifMatch: string | undefined;
}

export interface MedicalDiabetesSettingsService {
  getSettings(scope: AuthorizationScope): Promise<DiabetesSettingsView>;
  patchSettings(
    input: PatchDiabetesSettingsInput,
  ): Promise<DiabetesSettingsView>;
  getTargetProfile(
    scope: AuthorizationScope,
  ): Promise<GlucoseTargetProfileView>;
  putTargetProfile(
    input: PutGlucoseTargetProfileInput,
  ): Promise<GlucoseTargetProfileView>;
  clearTargetProfile(
    input: ClearGlucoseTargetProfileInput,
  ): Promise<GlucoseTargetProfileView>;
}

function settingsBootstrapResourceId(subjectId: string): string {
  return `${SETTINGS_BOOTSTRAP_PREFIX}${subjectId}`;
}

function targetBootstrapResourceId(subjectId: string): string {
  return `${TARGET_BOOTSTRAP_PREFIX}${subjectId}`;
}

function createUnconfiguredSettings(subjectId: string): DiabetesSettings {
  const timestamp = new Date(0).toISOString();
  return {
    settingsId: '00000000-0000-0000-0000-000000000000',
    subjectId,
    glucoseDisplayUnit: null,
    diabetesType: {
      category: 'unknown',
      otherDescriptor: null,
      source: 'self_reported',
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    revision: 0n,
  };
}

function createUnconfiguredTargetProfile(
  subjectId: string,
): GlucoseTargetProfile {
  const timestamp = new Date(0).toISOString();
  return {
    profileId: '00000000-0000-0000-0000-000000000000',
    subjectId,
    defaultRange: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    revision: 0n,
  };
}

function settingsLockKey(subjectId: string): string {
  return `diabetes-settings|${subjectId}`;
}

function targetLockKey(subjectId: string): string {
  return `glucose-target-profile|${subjectId}`;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    ('code' in error ? error.code === '23505' : /unique/i.test(error.message))
  );
}

export function createMedicalDiabetesSettingsService(
  database: MedicalDatabase,
  environment: MedicalEnvironment,
): MedicalDiabetesSettingsService {
  const allowTestDefault = environment.databaseMode === 'pglite';
  const revisionTokens = createRevisionTokenService(
    environment.revisionTokenSecret,
    { allowTestDefault },
  );

  function createBootstrapToken(resourceId: string): string {
    return revisionTokens.createToken(resourceId, 1n);
  }

  function toSettingsEtag(settings: DiabetesSettings): string {
    return revisionTokens.createToken(settings.settingsId, settings.revision);
  }

  function toTargetEtag(profile: GlucoseTargetProfile): string {
    return revisionTokens.createToken(profile.profileId, profile.revision);
  }

  function parseIfMatch(
    ifMatch: string | undefined,
    resourceId: string,
  ): ReturnType<RevisionTokenService['verifyAndParse']> {
    if (!ifMatch?.trim()) {
      throw new InvalidRevisionPreconditionError(
        'If-Match header is required.',
      );
    }

    try {
      return revisionTokens.verifyAndParse(ifMatch.trim(), resourceId);
    } catch (error) {
      if (
        error instanceof MalformedRevisionTokenError ||
        error instanceof InvalidPersistenceRevisionTokenError
      ) {
        throw new InvalidRevisionTokenError(
          'If-Match revision token is invalid.',
        );
      }
      throw error;
    }
  }

  function auditSettingsChange(
    auditRepository: ReturnType<typeof createMedicalAuditRepository>,
    scope: AuthorizationScope,
    settings: DiabetesSettings,
    field: string,
    oldValue: unknown,
    newValue: unknown,
  ): Promise<void> {
    return auditRepository.insert({
      actorAccountId: scope.accountId,
      subjectId: scope.subjectId,
      action: DIABETES_SETTINGS_AUDIT_ACTIONS.settingsUpdated,
      resourceType: DIABETES_SETTINGS_AUDIT_RESOURCE_TYPES.diabetesSettings,
      resourceId: settings.settingsId,
      outcome: 'success',
      correlationId: scope.correlationId,
      detail: {
        field,
        oldValue,
        newValue,
      },
    });
  }

  function auditTargetChange(
    auditRepository: ReturnType<typeof createMedicalAuditRepository>,
    scope: AuthorizationScope,
    profile: GlucoseTargetProfile,
    action:
      | typeof DIABETES_SETTINGS_AUDIT_ACTIONS.targetRangeUpdated
      | typeof DIABETES_SETTINGS_AUDIT_ACTIONS.targetRangeCleared,
    oldValue: GlucoseTargetRange | null,
    newValue: GlucoseTargetRange | null,
  ): Promise<void> {
    return auditRepository.insert({
      actorAccountId: scope.accountId,
      subjectId: scope.subjectId,
      action,
      resourceType: DIABETES_SETTINGS_AUDIT_RESOURCE_TYPES.glucoseTargetProfile,
      resourceId: profile.profileId,
      outcome: 'success',
      correlationId: scope.correlationId,
      detail: {
        field: 'defaultRange',
        oldValue,
        newValue,
        source: newValue?.source ?? oldValue?.source ?? 'user_defined',
      },
    });
  }

  return {
    async getSettings(scope) {
      const repository = createDiabetesSettingsRepository(database);
      const existing = await repository.findBySubjectId(scope.subjectId);

      if (!existing) {
        const settings = createUnconfiguredSettings(scope.subjectId);
        return {
          configured: false,
          settings,
          etagToken: createBootstrapToken(
            settingsBootstrapResourceId(scope.subjectId),
          ),
        };
      }

      return {
        configured: true,
        settings: existing,
        etagToken: toSettingsEtag(existing),
      };
    },

    async patchSettings(input) {
      return database.transaction(async (tx) => {
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${settingsLockKey(input.scope.subjectId)}))`,
        );

        const settingsRepository = createDiabetesSettingsRepository(tx);
        const auditRepository = createMedicalAuditRepository(tx);
        const existing = await settingsRepository.findBySubjectId(
          input.scope.subjectId,
        );

        if (!existing) {
          parseIfMatch(
            input.ifMatch,
            settingsBootstrapResourceId(input.scope.subjectId),
          );

          let created: DiabetesSettings;
          try {
            created = await settingsRepository.insert(input.scope.subjectId, {
              glucoseDisplayUnit: input.patch.glucoseDisplayUnit,
              diabetesType: input.patch.diabetesType,
            });
          } catch (error) {
            if (!isUniqueViolation(error)) {
              throw error;
            }

            const raced = await settingsRepository.findBySubjectId(
              input.scope.subjectId,
            );
            if (!raced) {
              throw error;
            }

            throw new MedicalRevisionConflictError(
              'The resource revision is stale.',
            );
          }

          if ('glucoseDisplayUnit' in input.patch) {
            await auditSettingsChange(
              auditRepository,
              input.scope,
              created,
              'glucoseDisplayUnit',
              null,
              created.glucoseDisplayUnit,
            );
          }

          if (input.patch.diabetesType) {
            await auditSettingsChange(
              auditRepository,
              input.scope,
              created,
              'diabetesType',
              {
                category: 'unknown',
                otherDescriptor: null,
                source: 'self_reported',
              },
              created.diabetesType,
            );
          }

          return {
            configured: true,
            settings: created,
            etagToken: toSettingsEtag(created),
          };
        }

        const parsed = parseIfMatch(input.ifMatch, existing.settingsId);
        const oldDisplayUnit = existing.glucoseDisplayUnit;
        const oldDiabetesType = existing.diabetesType;

        const updated = await settingsRepository.updateWithRevision(
          input.scope.subjectId,
          existing.settingsId,
          parsed.revision,
          input.patch,
        );

        if (!updated) {
          throw new MedicalRevisionConflictError(
            'The resource revision is stale.',
          );
        }

        if (
          'glucoseDisplayUnit' in input.patch &&
          updated.glucoseDisplayUnit !== oldDisplayUnit
        ) {
          await auditSettingsChange(
            auditRepository,
            input.scope,
            updated,
            'glucoseDisplayUnit',
            oldDisplayUnit,
            updated.glucoseDisplayUnit,
          );
        }

        if (
          input.patch.diabetesType &&
          JSON.stringify(updated.diabetesType) !==
            JSON.stringify(oldDiabetesType)
        ) {
          await auditSettingsChange(
            auditRepository,
            input.scope,
            updated,
            'diabetesType',
            oldDiabetesType,
            updated.diabetesType,
          );
        }

        return {
          configured: true,
          settings: updated,
          etagToken: toSettingsEtag(updated),
        };
      });
    },

    async getTargetProfile(scope) {
      const repository = createGlucoseTargetProfileRepository(database);
      const existing = await repository.findBySubjectId(scope.subjectId);

      if (!existing) {
        const profile = createUnconfiguredTargetProfile(scope.subjectId);
        return {
          configured: false,
          profile,
          etagToken: createBootstrapToken(
            targetBootstrapResourceId(scope.subjectId),
          ),
        };
      }

      return {
        configured: existing.defaultRange !== null,
        profile: existing,
        etagToken: toTargetEtag(existing),
      };
    },

    async putTargetProfile(input) {
      const userDefinedRange: GlucoseTargetRange = {
        lowMmolPerL: input.range.lowMmolPerL,
        highMmolPerL: input.range.highMmolPerL,
        source: 'user_defined',
      };

      return database.transaction(async (tx) => {
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${targetLockKey(input.scope.subjectId)}))`,
        );

        const profileRepository = createGlucoseTargetProfileRepository(tx);
        const auditRepository = createMedicalAuditRepository(tx);
        const existing = await profileRepository.findBySubjectId(
          input.scope.subjectId,
        );

        if (!existing) {
          parseIfMatch(
            input.ifMatch,
            targetBootstrapResourceId(input.scope.subjectId),
          );

          let created: GlucoseTargetProfile;
          try {
            created = await profileRepository.insertWithRange(
              input.scope.subjectId,
              userDefinedRange,
            );
          } catch (error) {
            if (!isUniqueViolation(error)) {
              throw error;
            }

            const raced = await profileRepository.findBySubjectId(
              input.scope.subjectId,
            );
            if (!raced) {
              throw error;
            }

            throw new MedicalRevisionConflictError(
              'The resource revision is stale.',
            );
          }

          await auditTargetChange(
            auditRepository,
            input.scope,
            created,
            DIABETES_SETTINGS_AUDIT_ACTIONS.targetRangeUpdated,
            null,
            userDefinedRange,
          );

          return {
            configured: true,
            profile: created,
            etagToken: toTargetEtag(created),
          };
        }

        const parsed = parseIfMatch(input.ifMatch, existing.profileId);
        const oldRange = existing.defaultRange;

        const updated = await profileRepository.updateRangeWithRevision(
          input.scope.subjectId,
          existing.profileId,
          parsed.revision,
          userDefinedRange,
        );

        if (!updated) {
          throw new MedicalRevisionConflictError(
            'The resource revision is stale.',
          );
        }

        await auditTargetChange(
          auditRepository,
          input.scope,
          updated,
          DIABETES_SETTINGS_AUDIT_ACTIONS.targetRangeUpdated,
          oldRange,
          userDefinedRange,
        );

        return {
          configured: true,
          profile: updated,
          etagToken: toTargetEtag(updated),
        };
      });
    },

    async clearTargetProfile(input) {
      return database.transaction(async (tx) => {
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${targetLockKey(input.scope.subjectId)}))`,
        );

        const profileRepository = createGlucoseTargetProfileRepository(tx);
        const auditRepository = createMedicalAuditRepository(tx);
        const existing = await profileRepository.findBySubjectId(
          input.scope.subjectId,
        );

        if (!existing) {
          parseIfMatch(
            input.ifMatch,
            targetBootstrapResourceId(input.scope.subjectId),
          );

          const profile = createUnconfiguredTargetProfile(
            input.scope.subjectId,
          );

          return {
            configured: false,
            profile,
            etagToken: createBootstrapToken(
              targetBootstrapResourceId(input.scope.subjectId),
            ),
          };
        }

        if (existing.defaultRange === null) {
          parseIfMatch(input.ifMatch, existing.profileId);

          return {
            configured: false,
            profile: existing,
            etagToken: toTargetEtag(existing),
          };
        }

        const parsed = parseIfMatch(input.ifMatch, existing.profileId);
        const oldRange = existing.defaultRange;

        const updated = await profileRepository.clearRangeWithRevision(
          input.scope.subjectId,
          existing.profileId,
          parsed.revision,
        );

        if (!updated) {
          throw new MedicalRevisionConflictError(
            'The resource revision is stale.',
          );
        }

        await auditTargetChange(
          auditRepository,
          input.scope,
          updated,
          DIABETES_SETTINGS_AUDIT_ACTIONS.targetRangeCleared,
          oldRange,
          null,
        );

        return {
          configured: false,
          profile: updated,
          etagToken: toTargetEtag(updated),
        };
      });
    },
  };
}
