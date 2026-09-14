import type { SandboxedPlugin } from 'emdash/plugin';

export default {
  hooks: {
    'content:beforeDelete': async () => {
      await fetch('http://127.0.0.1:8800/entered', { method: 'POST' });
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    'content:beforeSave': async (event) => {
      if (!event.isNew && event.content.title === 'delayed-save') {
        await fetch('http://127.0.0.1:8800/entered', { method: 'POST' });
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    },
  },
} satisfies SandboxedPlugin;
