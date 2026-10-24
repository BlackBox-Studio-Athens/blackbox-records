import path from 'node:path';

// Native reporters retain assertion locations without parsing human console output.
export function validationReporters(suite: string) {
  const directory = process.env.BLACKBOX_VALIDATION_REPORT_DIR;
  return {
    // Concurrent Nx jobs must not clear each other's Vitest 5 cache after a lockfile change.
    fsModuleCachePath: path.resolve(
      import.meta.dirname,
      '../.codex-artifacts/vitest-cache',
      process.env.NX_TASK_TARGET_PROJECT ?? suite,
    ),
    ...(directory
      ? { reporters: ['default', 'json'] as ('default' | 'json')[], outputFile: path.join(directory, `${suite}.json`) }
      : {}),
  };
}
