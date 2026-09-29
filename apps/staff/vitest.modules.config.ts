import { defineConfig } from 'vitest/config';
import node from './vitest.config.ts';
import { moduleTestProjects } from '../../scripts/module-test-projects.ts';
import { validationReporters } from '../../scripts/validation-reporters.ts';

export default defineConfig({
  test: {
    maxWorkers: 1,
    ...validationReporters(process.env.NX_TASK_TARGET_PROJECT ?? 'staff'),
    projects: moduleTestProjects('staff', node),
  },
});
