export function publicRoutePatterns(
  routes: readonly { type: string; pattern?: string; patternRegex?: RegExp }[],
): string[];
