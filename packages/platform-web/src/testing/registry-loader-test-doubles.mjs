/**
 * Test-only registry loader where the first load() call stalls until released.
 *
 * Subsequent load() calls resolve immediately. This models loaders where later
 * calls may complete before LocalizationPlatform internal registry cache is set.
 *
 * Not part of the public package API.
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
 * Test-only registry loader that always rejects.
 *
 * Not part of the public package API.
 */
export function createRejectingRegistryLoader(
  message = 'Registry load failed.',
) {
  return {
    async load() {
      throw new Error(message);
    },
  };
}

/**
 * Test-only bundle loader that always rejects.
 *
 * Not part of the public package API.
 */
export function createRejectingBundleLoader(message = 'Bundle load failed.') {
  return {
    async load() {
      throw new Error(message);
    },
  };
}

/**
 * Test-only registry loader that resolves after a delay on every call.
 *
 * Not part of the public package API.
 */
export function createDelayedRegistryLoader(registry, delayMs) {
  return {
    async load() {
      await new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      });

      return registry;
    },
  };
}
