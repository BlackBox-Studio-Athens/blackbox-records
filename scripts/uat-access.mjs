const uatHost = /^(?:[a-z0-9-]+\.)?blackbox-records-web-uat\.pages\.dev$/;
const isUatSite = (url) => {
  const target = new URL(url);
  return target.protocol === 'https:' && !target.port && uatHost.test(target.hostname);
};

export function uatAccessHeaders(url, env = process.env) {
  if (!isUatSite(url)) return {};
  const id = env.UAT_ACCESS_CLIENT_ID;
  const secret = env.UAT_ACCESS_CLIENT_SECRET;
  if (Boolean(id) !== Boolean(secret)) throw new Error('Set both UAT Access service-token secrets.');
  return id ? { 'CF-Access-Client-Id': id, 'CF-Access-Client-Secret': secret } : {};
}

// Handle redirects ourselves: service-token headers must never follow a redirect to another origin.
export async function fetchWithUatAccess(url, init = {}, request = fetch, env = process.env) {
  const headers = new Headers(init.headers);
  for (const [name, value] of Object.entries(uatAccessHeaders(url, env))) headers.set(name, value);
  if (!isUatSite(url)) return request(url, init);
  const response = await request(url, { ...init, headers, redirect: 'manual' });
  if (response.status >= 300 && response.status < 400 && response.headers.has('Location')) {
    await response.body?.cancel();
    throw new Error('UAT read redirected; verify its Access service token, policy and requested route.');
  }
  return response;
}
