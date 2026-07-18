import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

type ObservabilityConfig = {
  enabled?: boolean;
  logs?: {
    destinations?: string[];
    enabled?: boolean;
    head_sampling_rate?: number;
    invocation_logs?: boolean;
  };
  traces?: {
    destinations?: string[];
    enabled?: boolean;
    head_sampling_rate?: number;
  };
};

type WranglerConfig = {
  env?: Record<
    string,
    {
      observability?: ObservabilityConfig;
      triggers?: { crons?: string[] };
    }
  >;
  observability?: ObservabilityConfig;
};

type WranglerSchema = {
  definitions?: {
    Observability?: {
      properties?: Record<
        string,
        {
          properties?: Record<string, unknown>;
        }
      >;
    };
  };
};

const expectedTraceSampling = new Map([
  ['base', 1],
  ['mock', 1],
  ['mock-api', 1],
  ['uat', 0.1],
  ['prd', 0.01],
]);

describe('Worker observability config', () => {
  it('deploys an explicit empty UAT cron list so Wrangler removes old triggers', () => {
    expect(readWranglerConfig().env?.uat?.triggers?.crons).toEqual([]);
  });

  it('keeps logs and traces explicit for all runtime targets', () => {
    const config = readWranglerConfig();
    const observabilitySchema = readWranglerSchema().definitions?.Observability?.properties ?? {};
    const allowedObservabilityKeys = new Set(Object.keys(observabilitySchema));
    const allowedLogKeys = new Set(Object.keys(observabilitySchema.logs?.properties ?? {}));
    const allowedTraceKeys = new Set(Object.keys(observabilitySchema.traces?.properties ?? {}));
    const targets = new Map<string, ObservabilityConfig | undefined>([
      ['base', config.observability],
      ['mock', config.env?.mock?.observability],
      ['mock-api', config.env?.['mock-api']?.observability],
      ['uat', config.env?.uat?.observability],
      ['prd', config.env?.prd?.observability],
    ]);

    for (const [target, observability] of targets) {
      expect(observability, target).toMatchObject({
        enabled: true,
        logs: {
          enabled: true,
          head_sampling_rate: 1,
          invocation_logs: true,
        },
        traces: {
          enabled: true,
          head_sampling_rate: expectedTraceSampling.get(target),
        },
      });
      expect(observability?.logs?.destinations ?? []).toEqual([]);
      expect(observability?.traces?.destinations ?? []).toEqual([]);
      expect(Object.keys(observability ?? {}).every((key) => allowedObservabilityKeys.has(key))).toBe(true);
      expect(Object.keys(observability?.logs ?? {}).every((key) => allowedLogKeys.has(key))).toBe(true);
      expect(Object.keys(observability?.traces ?? {}).every((key) => allowedTraceKeys.has(key))).toBe(true);
    }
  });
});

function readWranglerConfig(): WranglerConfig {
  const source = readFileSync(join(process.cwd(), 'wrangler.jsonc'), 'utf8');

  return parseJsonc<WranglerConfig>(source);
}

function readWranglerSchema(): WranglerSchema {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'node_modules/wrangler/config-schema.json'), 'utf8'),
  ) as WranglerSchema;
}

function parseJsonc<T>(source: string): T {
  return JSON.parse(
    source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1')
      .replace(/,\s*([}\]])/g, '$1'),
  ) as T;
}
