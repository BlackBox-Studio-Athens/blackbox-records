import http from 'node:http';
import https from 'node:https';
import { describe, expect, it } from 'vitest';

describe('lightweight network guard', () => {
  it('rejects an unmocked fetch', async () => {
    await expect(fetch('https://unmocked.invalid/')).rejects.toThrow(/unmocked network request/);
  });

  it('rejects Node HTTP and HTTPS requests before they reach the network', () => {
    expect(() => http.get('http://unmocked.invalid/')).toThrow(/unmocked network request/);
    expect(() => https.request('https://unmocked.invalid/')).toThrow(/unmocked network request/);
  });
});
