import { DecapRuntimeConfigError, resolveDecapHostedRuntimeConfig } from '../src/lib/admin/decap-runtime-config';

try {
  resolveDecapHostedRuntimeConfig({
    environment: { ...process.env, DECAP_BACKEND_MODE: 'hosted' },
    isDevelopment: false,
  });
  console.log('Hosted Decap settings verified.');
} catch (error: unknown) {
  console.error(
    error instanceof DecapRuntimeConfigError
      ? error.message
      : 'Hosted Decap settings could not be validated. Review the named workflow settings.',
  );
  process.exitCode = 1;
}
