import type { APIRoute } from 'astro';

import { createProjectRelativeUrl } from '@/config/site';

export const GET: APIRoute = ({ request }) => {
  const target = new URL(createProjectRelativeUrl('/assets/images/brand/logo.png'), request.url);
  return new Response(null, {
    status: 302,
    headers: {
      Location: target.toString(),
    },
  });
};
