import type { SandboxedPlugin } from 'emdash/plugin';
import { ContentSaveRejectedError } from 'emdash';
import { contentMediaIds, isCmsCollection, validateCmsDraft } from '@blackbox/content-model';
import { deletePriceDraftFor, priceDraftRoute, priceDraftRouteEntry } from './price-drafts';

export default {
  routes: { [priceDraftRoute]: priceDraftRouteEntry },
  hooks: {
    'content:beforeSave': {
      errorPolicy: 'abort',
      handler: async (event, context) => {
        if (!isCmsCollection(event.collection)) throw new ContentSaveRejectedError('Unsupported editorial collection.');
        const issues = validateCmsDraft(event.collection, event.content);
        if (issues.length) throw new ContentSaveRejectedError(issues.join('\n'));
        if (['releases', 'news'].includes(event.collection) && event.content.artist) {
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
    'content:beforeDelete': async (event, context) => {
      if (event.permanent) return false;
      if (['news', 'socials'].includes(event.collection)) return true;
      if (!['artists', 'releases'].includes(event.collection)) return false;
      const item = await context.content?.get(event.collection, event.id);
      return Boolean(item && item.status === 'draft' && !item.liveRevisionId && !item.publishedAt);
    },
    'content:afterDelete': async (event, context) => {
      await deletePriceDraftFor(context, { collection: event.collection, recordId: event.id });
    },
  },
} satisfies SandboxedPlugin;
