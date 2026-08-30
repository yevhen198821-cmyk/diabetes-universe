import type { QuickAddCategory } from '@diabetes-universe/types';

export function shouldCloseQuickAddOnFormCancel(
  openCategory: QuickAddCategory | null | undefined,
  userSelection: string | null | undefined,
): boolean {
  return openCategory != null && userSelection === undefined;
}
