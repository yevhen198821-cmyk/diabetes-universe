/**
 * Minimal PlatformFormatter stub for Platform Runtime Foundation unit tests.
 *
 * Not part of the public package API.
 */
export function createStubPlatformFormatter(overrides = {}) {
  return {
    formatDate: () => '2026-08-02',
    formatTime: () => '15:30',
    formatDateTime: () => '2026-08-02 15:30',
    formatRelativeTime: () => 'in 2 hours',
    formatNumber: () => '1,234.5',
    formatPercentage: () => '25%',
    formatCurrency: () => '€10.00',
    formatDuration: () => '1 hour',
    formatRange: () => '0–100',
    formatMeasurement: () => '5.6 mmol/L',
    ...overrides,
  };
}
