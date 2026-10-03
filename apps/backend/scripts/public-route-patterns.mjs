/** Astro resolved-route `pattern` is a route string; `patternRegex` is the matching regular expression. */
export function publicRoutePatterns(routes) {
  return routes
    .filter((route) => route.type !== 'fallback')
    .map((route) => {
      if (!(route.patternRegex instanceof RegExp)) throw new Error('Public route regex required.');
      return route.patternRegex.source;
    });
}
