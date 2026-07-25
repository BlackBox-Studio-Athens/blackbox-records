import { resolveArtistSlugForSave } from '@/lib/admin/decap-artist-slug';

type AdminWindow = Window & {
  __BLACKBOX_ADMIN__?: Record<string, unknown>;
};

const adminWindow = window as AdminWindow;
adminWindow.__BLACKBOX_ADMIN__ = {
  ...adminWindow.__BLACKBOX_ADMIN__,
  resolveArtistSlugForSave,
};
