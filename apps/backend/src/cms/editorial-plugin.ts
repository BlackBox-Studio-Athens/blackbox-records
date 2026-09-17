import type { SandboxedPlugin } from 'emdash/plugin';
import { ContentSaveRejectedError } from 'emdash';
import { contentMediaIds, isCmsCollection, validateCmsDraft } from '@blackbox/content-model';

export default {
  hooks: {
    'content:beforeSave': {
      errorPolicy: 'abort',
      handler: async (event, context) => {
        if (!isCmsCollection(event.collection)) throw new ContentSaveRejectedError('Unsupported editorial collection.');
        const issues = validateCmsDraft(event.collection, event.content);
        if (issues.length) throw new ContentSaveRejectedError(issues.join('\n'));
        if (event.collection === 'releases' && event.content.artist) {
          const artist = await context.content?.get('artists', String(event.content.artist));
          if (!artist) throw new ContentSaveRejectedError('artist: Select an existing Artist.');
        }
        for (const id of contentMediaIds(event.content)) {
          const media = await context.media?.get(id);
          if (!media || !media.mimeType.startsWith('image/'))
            throw new ContentSaveRejectedError('image: Select an existing image.');
        }
      },
    },
    'content:beforeDelete': async (event) => {
      // Ordinary member editing can trash News and social links only. Permanent
      // deletion is unavailable; recovery keeps media and historical references.
      return !event.permanent && ['news', 'socials'].includes(event.collection);
    },
  },
} satisfies SandboxedPlugin;
