import { resolveArtistSlugForSave } from './decap-artist-slug';
import { registerPreviews } from './previews';

const sveltiaRuntimeUrl = 'https://unpkg.com/@sveltia/cms@0.205.2/dist/sveltia-cms.js';

export function preserveArtistSlug({ entry }) {
  const data = entry.get('data');
  if (entry.get('collection') !== 'artists' || String(data.get('slug') ?? '').trim()) return data;
  return data.set('slug', resolveArtistSlugForSave('', String(data.get('title') ?? '')));
}

export async function startAdmin() {
  const status = document.querySelector('#cms-status');
  const copy = status.querySelector('p');
  try {
    const response = await fetch('./config.yml');
    if (!response.ok) throw new Error('Configuration request failed.');
    const mode = /^# blackbox-sveltia-mode: (local|hosted|disabled)$/m.exec(await response.text())?.[1];
    if (!mode) throw new Error('Missing CMS mode.');
    if (mode === 'disabled') {
      copy.textContent = 'CMS unavailable for this build. Use the approved BlackBox CMS link.';
      return;
    }
    copy.textContent =
      mode === 'hosted'
        ? 'Sign in through GitHub OAuth with the designated BlackBox CMS account.'
        : 'Select the repository directory in Chromium. Local saves need a separate Git commit and push.';
    window.CMS_MANUAL_INIT = true;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = sveltiaRuntimeUrl;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
    const { CMS, createClass, h } = window;
    registerPreviews(CMS, createClass, h);
    CMS.registerEventListener({ name: 'preSave', handler: preserveArtistSlug });
    await CMS.init();
    status.remove();
  } catch {
    status.setAttribute('role', 'alert');
    copy.textContent = 'The editor could not load. Check your connection, then reload this page.';
  }
}
