// Finishes the GitHub OAuth flow and hands the token to the CMS window that opened the popup.
const js = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

// "https://*.example.org" allows every https subdomain of example.org; other entries must match exactly.
function parseOrigins(list) {
  const exact = [];
  const suffixes = [];
  for (const o of list) {
    if (o.startsWith('https://*.')) suffixes.push(o.slice('https://*'.length));
    else exact.push(o);
  }
  return { exact, suffixes };
}

function respond(status, payload, origins) {
  const { exact, suffixes } = parseOrigins(origins);
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  const html = `<!doctype html><meta charset="utf-8"><title>Inloggen</title><p>Even geduld...</p><script>
(() => {
  const exact = ${js(exact)};
  const suffixes = ${js(suffixes)};
  const allowed = (origin) => {
    if (exact.includes(origin)) return true;
    try {
      const u = new URL(origin);
      return u.protocol === 'https:' && u.port === '' && suffixes.some((s) => u.hostname.endsWith(s));
    } catch {
      return false;
    }
  };
  const message = ${js(message)};
  window.addEventListener('message', (e) => {
    if (!allowed(e.origin)) return;
    window.opener.postMessage(message, e.origin);
    window.close();
  });
  window.opener.postMessage('authorizing:github', '*');
})();
</script>`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Set-Cookie': 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/callback; Max-Age=0',
    },
  });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const origins = [url.origin, ...(env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean)];
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookie = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)oauth_state=([^;]+)/)?.[1];

  if (!code || !state || state !== cookie) {
    return respond('error', { message: 'Ongeldige inlogpoging, probeer het opnieuw.' }, origins);
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'scouting-cms-auth' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/callback`,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.access_token) {
    return respond('error', { message: data.error_description || 'Inloggen bij GitHub is mislukt.' }, origins);
  }
  return respond('success', { token: data.access_token, provider: 'github' }, origins);
}
