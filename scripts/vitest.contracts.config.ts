import { validationReporters } from './validation-reporters.ts';

export default {
  test: {
    ...validationReporters('contracts'),
    include: ['scripts/**/*.test.ts'],
    maxWorkers: 1,
  },
};
