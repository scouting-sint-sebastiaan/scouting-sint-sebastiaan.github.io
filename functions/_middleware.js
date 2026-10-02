// Tijdelijke pagina op het definitieve domein totdat livegang in het beheer aan staat.
import livegang from '../src/data/livegang.json';

const tijdelijk = ['www.scoutingsintsebastiaan.nl', 'scoutingsintsebastiaan.nl'];

const pagina = `<!doctype html>
<html lang="nl">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Scouting St. Sebastiaan</title>
<h1>Scouting St. Sebastiaan</h1>
<p>Binnenkort vind je hier onze nieuwe website.</p>
<p>Vragen? Mail naar <a href="mailto:info@scoutingsintsebastiaan.nl">info@scoutingsintsebastiaan.nl</a>.</p>
</html>
`;

export async function onRequest({ request, next }) {
  if (livegang.live || !tijdelijk.includes(new URL(request.url).hostname)) return next();
  return new Response(pagina, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' },
  });
}
