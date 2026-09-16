import { validationReporters } from './validation-reporters.ts';

export default {
  test: {
    ...validationReporters('contracts'),
    include: ['scripts/check-frontend-route-isolation.test.ts', 'scripts/pages-workflow-contract.test.ts'],
  },
};
