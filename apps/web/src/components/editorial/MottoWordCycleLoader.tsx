import { useEffect } from 'react';

import { defineMottoWordCycle } from './motto-word-cycle';

/**
 * Registers <motto-word-cycle> from Home only. The shell hydrates the islands of pages it inserts but never runs their
 * scripts, so an island reaches Home on every visit while other pages' eager scripts stay unchanged.
 */
export default function MottoWordCycleLoader() {
  useEffect(defineMottoWordCycle, []);
  return null;
}
