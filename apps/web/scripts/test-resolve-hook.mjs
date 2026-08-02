export async function resolve(specifier, context, nextResolve) {
  if (
    specifier.startsWith('.') &&
    !specifier.endsWith('.ts') &&
    !specifier.endsWith('.tsx') &&
    !specifier.endsWith('.js') &&
    !specifier.endsWith('.mjs')
  ) {
    for (const candidate of [
      `${specifier}.ts`,
      `${specifier}.tsx`,
      `${specifier}/index.ts`,
      `${specifier}/index.tsx`,
    ]) {
      try {
        return await nextResolve(candidate, context);
      } catch {
        // Try the next candidate.
      }
    }
  }

  return nextResolve(specifier, context);
}
