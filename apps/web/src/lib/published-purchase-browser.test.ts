import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPurchaseInformation, inlinesPurchaseInformation } from './published-purchase-browser';

const stubDocument = (textContent: string | null) =>
  vi.stubGlobal('document', {
    getElementById: (id: string) => (id === 'purchase-information' && textContent !== null ? { textContent } : null),
  });

afterEach(() => vi.unstubAllGlobals());

describe('hosted browser purchase-information reader', () => {
  it('reads the published entry the hosted layout inlines, including escaped markup', () => {
    expect(inlinesPurchaseInformation).toBe(true);
    stubDocument(JSON.stringify({ terms: { note: '<b>' } }).replaceAll('<', '\\u003c'));
    expect(getPurchaseInformation()).toEqual({ terms: { note: '<b>' } });
  });

  it('treats a missing or unpublished entry as no purchase information', () => {
    stubDocument(null);
    expect(getPurchaseInformation()).toBeNull();
    stubDocument('null');
    expect(getPurchaseInformation()).toBeNull();
  });
});
