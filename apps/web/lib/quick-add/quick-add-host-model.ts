import type { QuickAddCategory } from '@diabetes-universe/types';

import type { GlucoseQuickAddSubmitRequest } from './glucose-quick-add-submit';

export function shouldCloseQuickAddOnFormCancel(
  openCategory: QuickAddCategory | null | undefined,
  userSelection: string | null | undefined,
): boolean {
  return openCategory != null && userSelection === undefined;
}

export async function finalizeGlucoseQuickAddSubmit(
  submit:
    ((request: GlucoseQuickAddSubmitRequest) => Promise<void>) | undefined,
  request: GlucoseQuickAddSubmitRequest,
): Promise<boolean> {
  if (!submit) {
    return false;
  }

  await submit(request);
  return true;
}
