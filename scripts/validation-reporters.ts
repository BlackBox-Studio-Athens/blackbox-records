import path from 'node:path';

// Native reporters retain assertion locations without parsing human console output.
export function validationReporters(suite: string) {
  const directory = process.env.BLACKBOX_VALIDATION_REPORT_DIR;
  return directory
    ? { reporters: ['default', 'json'] as ('default' | 'json')[], outputFile: path.join(directory, `${suite}.json`) }
    : {};
}
