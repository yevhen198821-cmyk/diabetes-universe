import type { Brand } from './brand';

/**
 * Logical grouping for translation resources (for example `dashboard`).
 */
export type Namespace = Brand<string, 'Namespace'>;
