import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function publicTitleClass(title: string) {
  return /\p{Script=Greek}/u.test(title) ? 'public-title--greek' : undefined;
}
