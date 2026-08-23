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
  readonly clientAdoptionRunId?: string;
}

export interface TimelineAdoptionOrchestratorResult {
  readonly adoptionSessionId: string;
  readonly adoptedCount: number;
  readonly skippedCount: number;
  readonly failedCount: number;
}

const DEFAULT_BATCH_SIZE = 25;

export class TimelineAdoptionOrchestrator {
  private readonly repository: TimelineRepository;
  private readonly localStore: TimelineAdoptionLocalStore;
  private readonly transport: TimelineAdoptionTransport;
  private readonly sourcePlatform: string;
  private readonly sourceAppVersion: string;
  private readonly batchSize: number;
  private readonly clientAdoptionRunId: string;

  constructor(options: TimelineAdoptionOrchestratorOptions) {
    this.repository = options.repository;
    this.localStore = options.localStore;
    this.transport = options.transport;
    this.sourcePlatform = options.sourcePlatform ?? 'web';
    this.sourceAppVersion = options.sourceAppVersion ?? '0.0.0';
    this.batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
    this.clientAdoptionRunId =
      options.clientAdoptionRunId ??
      `run_${crypto.randomUUID().replace(/-/g, '')}`;
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

    const sessionResponse = await this.transport.createOrResumeSession({
      clientAdoptionRunId: this.clientAdoptionRunId,
      sourcePlatform: this.sourcePlatform,
      sourceAppVersion: this.sourceAppVersion,
      sourceSchemaMin: 1,
      sourceSchemaMax: 1,
      eligibleCount: eligible.length,
    });

    const adoptionSessionId = sessionResponse.session.adoptionSessionId;

    await this.localStore.saveSessionCheckpoint({
      clientAdoptionRunId: this.clientAdoptionRunId,
      adoptionSessionId,
      lifecycle: 'open',
      checkpoint: {
        eligibleCount: eligible.length,
        adoptedCount: 0,
        failedCount: 0,
      },
      createdAt: new Date().toISOString(),
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
        clientAdoptionRunId: this.clientAdoptionRunId,
        adoptionSessionId,
        lifecycle: 'open',
        checkpoint: {
          lastSubmittedLocalEventId: pending[pending.length - 1]?.localEventId,
          eligibleCount: eligible.length,
          adoptedCount,
          failedCount,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        storageSchemaVersion: 1,
      });
    }

    await this.transport.completeSession(adoptionSessionId);

    await this.localStore.saveSessionCheckpoint({
      clientAdoptionRunId: this.clientAdoptionRunId,
      adoptionSessionId,
      lifecycle: 'completed',
      checkpoint: {
        eligibleCount: eligible.length,
        adoptedCount,
        failedCount,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      storageSchemaVersion: 1,
    });

    return {
      adoptionSessionId,
      adoptedCount,
      skippedCount,
      failedCount,
    };
  }

  async classifyLocalEvents(): Promise<readonly TimelineAdoptionScanItem[]> {
    return scanTimelineForAdoption({
      repository: this.repository,
      isAcknowledged: (localEventId) =>
        this.localStore.hasAcknowledgement(localEventId),
    });
  }
}
