export function normalizeSelectionText(value: string) {
  const match = value.match(/[A-Za-z][A-Za-z']*/);
  return match ? match[0] : '';
}
