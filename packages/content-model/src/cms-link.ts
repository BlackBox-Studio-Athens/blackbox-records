export function isSafeCmsLink(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return (
      ![...value].some((character) => character <= ' ' || character === '\\') &&
      ['https:', 'http:', 'mailto:'].includes(new URL(value, 'https://content.invalid/').protocol)
    );
  } catch {
    return false;
  }
}
