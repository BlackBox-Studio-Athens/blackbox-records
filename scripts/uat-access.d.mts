export function uatAccessHeaders(url: string, env?: NodeJS.ProcessEnv): Record<string, string>;
export function fetchWithUatAccess(
  url: string,
  init?: RequestInit,
  request?: typeof fetch,
  env?: NodeJS.ProcessEnv,
): Promise<Response>;
