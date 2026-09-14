import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCmsImport } from './apply-cms-import.mjs';

test('PRD import binds explicit approval to the reviewed plan before any IO', async () => {
  const plan = { target: 'https://staff.blackboxrecordsathens.com', records: [], media: [], retainedAssets: [] };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error('Unexpected network request');
  };
  const readMedia = () => {
    throw new Error('Unexpected media read');
  };
  try {
    const report = await applyCmsImport(plan, readMedia);
    assert.match(report.planSha256, /^[a-f0-9]{64}$/);
    await assert.rejects(applyCmsImport(plan, readMedia, { apply: true }), /one-run/);
    await assert.rejects(
      applyCmsImport(plan, readMedia, { apply: true, confirmLiveCmsChanges: true, reviewedPlanSha256: 'wrong' }),
      /reviewed plan/,
    );
    const approved = { apply: true, confirmLiveCmsChanges: true, reviewedPlanSha256: report.planSha256 };
    assert.equal((await applyCmsImport(plan, readMedia, approved)).createdRecords, 0);
    await assert.rejects(
      applyCmsImport({ ...plan, retainedAssets: ['changed'] }, readMedia, approved),
      /reviewed plan/,
    );
    await assert.rejects(applyCmsImport({ ...plan, target: 'https://example.com' }, readMedia), /exact UAT\/PRD/);
    await assert.rejects(applyCmsImport(plan, readMedia, { ...approved, verifyOnly: true }), /separate operations/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
