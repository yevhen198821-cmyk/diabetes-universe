/**
 * Test-only registry loader doubles for controlled async readiness scenarios.
 *
 * Not part of the public package API.
 */

/**
 * @param {import('../../registry/locale-registry.ts').LocaleRegistry} registry
 */
export function createStalledFirstRegistryLoader(registry) {
  /** @type {(() => void) | null} */
  let releaseFirst = null;

  const loader = {
    loadCallCount: 0,

    async load() {
      loader.loadCallCount += 1;

      if (loader.loadCallCount === 1) {
        return new Promise((resolve) => {
          releaseFirst = () => resolve(registry);
        });
      }

      return registry;
    },

    releaseFirstPendingLoad() {
      const release = releaseFirst;
      releaseFirst = null;
      release?.();
    },
  };

  return loader;
}

/**
 * @param {string} [message]
 */
export function createRejectingRegistryLoader(
  message = 'Registry load failed.',
) {
  return {
    loadCallCount: 0,

    async load() {
      this.loadCallCount += 1;
      throw new Error(message);
    },
  };
}

/**
 * @param {import('../../registry/locale-registry.ts').LocaleRegistry} registry
 */
export function createCountingRegistryLoader(registry) {
  return {
    loadCallCount: 0,

    async load() {
      this.loadCallCount += 1;
      return registry;
    },
  };
}
