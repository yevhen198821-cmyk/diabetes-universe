export function assertInjectedPlatformService<T>(
  value: T | undefined | null,
  serviceName: 'localization' | 'formatter',
): T {
  if (value === undefined || value === null) {
    throw new Error(
      `Platform runtime requires an injected ${serviceName} platform service.`,
    );
  }

  return value;
}
