import type {
  AdoptionItemInput,
  AdoptionItemResult,
} from './timeline-adoption-types';
import type { TimelineRepository } from '@diabetes-universe/timeline';

import {
  createSourceNamespace,
  scanTimelineForAdoption,
  toAdoptionAcknowledgement,
  type TimelineAdoptionScanItem,
} from './timeline-adoption-scanner';
import type { TimelineAdoptionLocalStore } from './timeline-adoption-local-store';
import type { IndexedDbTimelineAdoptionSession } from '../persistence/indexeddb/timeline-indexeddb-schema';

export interface AdoptionSessionResponse {
  readonly session: {
    readonly adoptionSessionId: string;
    readonly lifecycleState: string;
  };
}

export interface AdoptionBatchResponse {
  readonly items: readonly AdoptionItemResult[];
}

export interface TimelineAdoptionTransport {
  createOrResumeSession(input: {
    clientAdoptionRunId: string;
    sourcePlatform: string;
    sourceAppVersion: string;
    sourceSchemaMin: number;
    sourceSchemaMax: number;
    eligibleCount: number;
  }): Promise<AdoptionSessionResponse>;
  adoptBatch(
    adoptionSessionId: string,
    items: readonly AdoptionItemInput[],
  ): Promise<AdoptionBatchResponse>;
  completeSession(adoptionSessionId: string): Promise<AdoptionSessionResponse>;
}

export interface TimelineAdoptionOrchestratorOptions {
  readonly repository: TimelineRepository;
  readonly localStore: TimelineAdoptionLocalStore;
  readonly transport: TimelineAdoptionTransport;
  readonly sourcePlatform?: string;
  readonly sourceAppVersion?: string;
  readonly batchSize?: number;
  /** When set, forces this run id instead of restoring a durable checkpoint. */
  readonly clientAdoptionRunId?: string;
  /** When true, ignores any resumable checkpoint and starts a fresh run id. */
  readonly forceNewRun?: boolean;
}

export interface TimelineAdoptionOrchestratorResult {
  readonly status: 'completed' | 'incomplete';
  readonly adoptionSessionId: string;
  readonly adoptedCount: number;
  readonly skippedCount: number;
  readonly failedCount: number;
}

const DEFAULT_BATCH_SIZE = 25;

function generateClientAdoptionRunId(): string {
  return `run_${crypto.randomUUID().replace(/-/g, '')}`;
}

export class TimelineAdoptionOrchestrator {
  private readonly repository: TimelineRepository;
  private readonly localStore: TimelineAdoptionLocalStore;
  private readonly transport: TimelineAdoptionTransport;
  private readonly sourcePlatform: string;
  private readonly sourceAppVersion: string;
  private readonly batchSize: number;
  private readonly explicitClientAdoptionRunId?: string;
  private readonly forceNewRun: boolean;

  constructor(options: TimelineAdoptionOrchestratorOptions) {
    this.repository = options.repository;
    this.localStore = options.localStore;
    this.transport = options.transport;
    this.sourcePlatform = options.sourcePlatform ?? 'web';
    this.sourceAppVersion = options.sourceAppVersion ?? '0.0.0';
    this.batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
    this.explicitClientAdoptionRunId = options.clientAdoptionRunId;
    this.forceNewRun = options.forceNewRun ?? false;
  }

  async run(): Promise<TimelineAdoptionOrchestratorResult> {
    const sourceNamespace = await this.localStore.ensureSourceNamespace(
      createSourceNamespace,
    );

    const scan = await scanTimelineForAdoption({
      repository: this.repository,
      isAcknowledged: (localEventId) =>
        this.localStore.hasAcknowledgement(localEventId),
    });

    const eligible = scan.filter((item) => item.classification === 'eligible');

    let clientAdoptionRunId = this.explicitClientAdoptionRunId;
    let restoredCheckpoint: IndexedDbTimelineAdoptionSession | null = null;

    if (!clientAdoptionRunId && !this.forceNewRun) {
      restoredCheckpoint =
        await this.localStore.getResumableSessionCheckpoint();
      if (restoredCheckpoint) {
        clientAdoptionRunId = restoredCheckpoint.clientAdoptionRunId;
      }
    }

    if (!clientAdoptionRunId) {
      clientAdoptionRunId = generateClientAdoptionRunId();
    }

    const checkpointCreatedAt =
      restoredCheckpoint?.createdAt ?? new Date().toISOString();

    const sessionResponse = await this.transport.createOrResumeSession({
      clientAdoptionRunId,
      sourcePlatform: this.sourcePlatform,
      sourceAppVersion: this.sourceAppVersion,
      sourceSchemaMin: 1,
      sourceSchemaMax: 1,
      eligibleCount: eligible.length,
    });

    const adoptionSessionId = sessionResponse.session.adoptionSessionId;

    await this.localStore.saveSessionCheckpoint({
      clientAdoptionRunId,
      adoptionSessionId,
      lifecycle: 'open',
      checkpoint: {
        eligibleCount: eligible.length,
        adoptedCount: restoredCheckpoint?.checkpoint.adoptedCount ?? 0,
        failedCount: restoredCheckpoint?.checkpoint.failedCount ?? 0,
      },
      createdAt: checkpointCreatedAt,
      updatedAt: new Date().toISOString(),
      storageSchemaVersion: 1,
    });

    let adoptedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (let index = 0; index < eligible.length; index += this.batchSize) {
      const batchItems = eligible.slice(index, index + this.batchSize);
      const pending: AdoptionItemInput[] = [];

      for (const item of batchItems) {
        if (!item.event) {
          continue;
        }

        if (await this.localStore.hasAcknowledgement(item.localEventId)) {
          skippedCount += 1;
          continue;
        }

        pending.push({
          sourceNamespace,
          localEventId: item.localEventId,
          sourceSchemaVersion: item.event.schemaVersion,
          event: item.event,
        });
      }

      if (pending.length === 0) {
        continue;
      }

      const batchResult = await this.transport.adoptBatch(
        adoptionSessionId,
        pending,
      );

      for (const outcome of batchResult.items) {
        if (
          outcome.status === 'adopted' ||
          outcome.status === 'already_adopted'
        ) {
          await this.localStore.saveAcknowledgement(
            toAdoptionAcknowledgement(
              outcome.localEventId,
              outcome.resourceId,
              outcome.revision,
              adoptionSessionId,
            ),
          );

          if (outcome.status === 'adopted') {
            adoptedCount += 1;
          } else {
            skippedCount += 1;
          }
        } else {
          failedCount += 1;
        }
      }

      await this.localStore.saveSessionCheckpoint({
        clientAdoptionRunId,
        adoptionSessionId,
        lifecycle: failedCount > 0 ? 'failed' : 'open',
        checkpoint: {
          lastSubmittedLocalEventId: pending[pending.length - 1]?.localEventId,
          eligibleCount: eligible.length,
          adoptedCount,
          failedCount,
        },
        createdAt: checkpointCreatedAt,
        updatedAt: new Date().toISOString(),
        storageSchemaVersion: 1,
      });
    }

    const unresolvedWithoutAck =
      await this.countEligibleWithoutAcknowledgement(eligible);
    const hasUnresolvedFailures = unresolvedWithoutAck > 0;

    if (hasUnresolvedFailures) {
      await this.localStore.saveSessionCheckpoint({
        clientAdoptionRunId,
        adoptionSessionId,
        lifecycle: 'failed',
        checkpoint: {
          eligibleCount: eligible.length,
          adoptedCount,
          failedCount,
        },
        createdAt: checkpointCreatedAt,
        updatedAt: new Date().toISOString(),
        storageSchemaVersion: 1,
      });

      return {
        status: 'incomplete',
        adoptionSessionId,
        adoptedCount,
        skippedCount,
        failedCount,
      };
    }

    await this.transport.completeSession(adoptionSessionId);

    await this.localStore.saveSessionCheckpoint({
      clientAdoptionRunId,
      adoptionSessionId,
      lifecycle: 'completed',
      checkpoint: {
        eligibleCount: eligible.length,
        adoptedCount,
        failedCount: 0,
      },
      createdAt: checkpointCreatedAt,
      updatedAt: new Date().toISOString(),
      storageSchemaVersion: 1,
    });

    return {
      status: 'completed',
      adoptionSessionId,
      adoptedCount,
      skippedCount,
      failedCount: 0,
    };
  }

  async classifyLocalEvents(): Promise<readonly TimelineAdoptionScanItem[]> {
    return scanTimelineForAdoption({
      repository: this.repository,
      isAcknowledged: (localEventId) =>
        this.localStore.hasAcknowledgement(localEventId),
    });
  }

  private async countEligibleWithoutAcknowledgement(
    eligible: readonly TimelineAdoptionScanItem[],
  ): Promise<number> {
    let unresolved = 0;
    for (const item of eligible) {
      if (!(await this.localStore.hasAcknowledgement(item.localEventId))) {
        unresolved += 1;
      }
    }
    return unresolved;
  }
}
