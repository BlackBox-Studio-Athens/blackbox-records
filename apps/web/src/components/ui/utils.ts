import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function publicTitleClass(title: string) {
  return /\p{Script=Greek}/u.test(title) ? 'public-title--greek' : undefined;
}

/** Marks Greek titles so CSS uppercase follows Greek rules and drops accents (ΧΡΌΝΙΑ → ΧΡΟΝΙΑ). */
export function publicTitleLang(title: string) {
  return /\p{Script=Greek}/u.test(title) ? 'el' : undefined;
}

/** Uppercases display text with Greek rules: Greek capitals drop accents, other scripts are unchanged. */
export function displayUppercase(text: string) {
  return text.toLocaleUpperCase('el');
}
