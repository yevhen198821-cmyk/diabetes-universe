/**
 * Prevents bootstrap modules from being imported in client bundles.
 */
export function ensureServerOnly(moduleName: string): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      `${moduleName} is server-only and cannot run in the browser.`,
    );
  }
}
