export type SveltiaBackendMode = 'local' | 'hosted' | 'disabled';
export type SveltiaRuntimeConfig = { mode: 'local' | 'disabled' } | { mode: 'hosted'; baseUrl: string };

export class SveltiaRuntimeConfigError extends Error {
  override name = 'SveltiaRuntimeConfigError';
}

export function resolveSveltiaBackendMode(options: {
  environment: Readonly<Record<string, string | undefined>>;
  isDevelopment: boolean;
}): SveltiaBackendMode {
  const value = options.environment.SVELTIA_BACKEND_MODE?.trim();
  if (value === undefined) return options.isDevelopment ? 'local' : 'disabled';
  if (value === 'local' || value === 'hosted' || value === 'disabled') return value;
  throw new SveltiaRuntimeConfigError('SVELTIA_BACKEND_MODE must be local, hosted, or disabled when set.');
}

export function resolveSveltiaRuntimeConfig(options: {
  environment: Readonly<Record<string, string | undefined>>;
  isDevelopment: boolean;
}): SveltiaRuntimeConfig {
  const mode = resolveSveltiaBackendMode(options);
  if (mode !== 'hosted') return { mode };
  const value = options.environment.SVELTIA_AUTH_BASE_URL?.trim() ?? '';
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new SveltiaRuntimeConfigError('SVELTIA_AUTH_BASE_URL must be the HTTPS authenticator origin.');
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/' ||
    url.port ||
    !hostname.includes('.') ||
    /(?:localhost|^127\.|^0\.|\[|\.local$|\.invalid$|\.test$|(^|\.)example\.(com|net|org)$|__|placeholder|change[-_]?me|replace[-_]?me|your[-_])/i.test(
      hostname,
    )
  ) {
    throw new SveltiaRuntimeConfigError(
      'SVELTIA_AUTH_BASE_URL must be a hosted HTTPS authenticator origin without placeholders, credentials, paths, or loopback addresses.',
    );
  }
  return { mode, baseUrl: url.origin };
}
