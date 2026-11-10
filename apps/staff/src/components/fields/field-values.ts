/** Keeps a count inside its range and says which limit stopped it. */
export function clampCount(value: number, min: number, max: number): { value: number; limited: 'min' | 'max' | null } {
  if (value > max) return { value: max, limited: 'max' };
  if (value < min) return { value: min, limited: 'min' };
  return { value, limited: null };
}

/** Today's calendar date in the browser's time zone, as YYYY-MM-DD. */
export function todayIsoDate(now = new Date()): string {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** A pasted address without a scheme is read as HTTPS; anything with another scheme stays as typed. */
export function withHttps(input: string): string {
  const text = input.trim();
  return /^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`;
}
