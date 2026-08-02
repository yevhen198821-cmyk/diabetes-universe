/**
 * Prevents client-only modules from being imported in server bundles.
 */
export function ensureClientOnly(moduleName: string): void {
  if (typeof window === 'undefined') {
    throw new Error(
      `${moduleName} is client-only and cannot run on the server.`,
    );
  }
}
