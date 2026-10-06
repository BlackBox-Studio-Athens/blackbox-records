import { baseService } from 'astro/assets';
import type { ExternalImageService } from 'astro';
import {
  isPublicImageRequestWidth,
  parsePublicMediaPath,
  publicImageTransformUrl,
  type PublicImageConfig,
  type PublicImageProfile,
} from './public-image-transform';

/** Only the site's fixed width/format/quality profiles may mint hosted transforms. */
const service: ExternalImageService<PublicImageConfig> = {
  ...baseService,
  getURL(options, config) {
    const source = typeof options.src === 'string' ? options.src : options.src.src;
    // Repo assets and private preview media pass through directly, with their original bytes.
    const parsed = parsePublicMediaPath(source.replace(/^\/blackbox-records(?=\/)/, ''));
    if (!parsed) return source;
    const width = options.width ?? (typeof options.src === 'object' ? options.src.width : undefined);
    if (!width) throw new Error('Published image width required.');
    const intrinsicWidth = typeof options.src === 'object' ? options.src.width : 0;
    if (!isPublicImageRequestWidth(String(width), intrinsicWidth))
      throw new Error('Unsupported published image width.');
    let profile: PublicImageProfile;
    if (options.format === 'jpg' && options.quality === undefined && width === Math.min(intrinsicWidth || 1200, 1200)) {
      profile = 'metadata';
    } else if ((options.format === undefined || options.format === 'webp') && options.quality === 68) {
      profile = 'editorial';
    } else if ((options.format === undefined || options.format === 'webp') && options.quality === 40 && width === 160) {
      profile = 'blur';
    } else if ((options.format === undefined || options.format === 'webp') && options.quality === undefined) {
      profile = options.format === 'webp' ? 'webp' : 'auto';
    } else {
      throw new Error('Unsupported published image format/quality profile.');
    }
    const transformed = publicImageTransformUrl(parsed.mediaSha256, config.service.config, width, profile);
    if (!transformed && config.service.config.transformationOrigin)
      throw new Error('Invalid hosted image configuration.');
    // Crawlers cannot run the browser's original fallback; keep JPEG unfurls behind the server fallback.
    if (transformed && profile === 'metadata')
      return `${config.endpoint.route}?href=${encodeURIComponent(source)}&w=1200&f=jpeg`;
    return transformed?.href ?? source;
  },
};

export default service;
