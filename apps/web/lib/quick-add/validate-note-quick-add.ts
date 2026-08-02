export const NOTE_TEXT_MAX_LENGTH = 500;
export const NOTE_TITLE_MAX_LENGTH = 80;

export function validateNoteQuickAddEntry(entry: {
  readonly text: string;
  readonly time: string;
  readonly title?: string;
}): string | null {
  const text = entry.text.trim();
  const title = entry.title?.trim() ?? '';

  if (text.length === 0) {
    return 'Введите текст заметки';
  }

  if (text.length > NOTE_TEXT_MAX_LENGTH) {
    return 'Заметка должна быть не длиннее 500 символов';
  }

  if (title.length > NOTE_TITLE_MAX_LENGTH) {
    return 'Заголовок должен быть не длиннее 80 символов';
  }

  if (entry.time.trim().length === 0) {
    return 'Укажите время';
  }

  return null;
}
