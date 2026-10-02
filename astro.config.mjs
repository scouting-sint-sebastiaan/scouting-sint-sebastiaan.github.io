import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import fotos from './integrations/fotos.mjs';
import cmsVoorbeeld from './integrations/cms-voorbeeld.mjs';
import zoeken from './integrations/zoeken.mjs';

// Vóór livegang loopt elke pagina via functions/_middleware.js; daarna alleen de echte Function-routes.
const pagesRoutes = {
  name: 'pages-routes',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const { live } = JSON.parse(readFileSync(new URL('./src/data/livegang.json', import.meta.url), 'utf8'));
      const routes = live
        ? { version: 1, include: ['/auth', '/callback', '/api/*'], exclude: [] }
        : { version: 1, include: ['/*'], exclude: ['/_astro/*', '/_fotos/*', '/pagefind/*', '/uploads/*', '/tc4/*'] };
      writeFileSync(new URL('_routes.json', dir), JSON.stringify(routes, null, 2) + '\n');
    },
  },
};

export default defineConfig({
  site: 'https://www.scoutingsintsebastiaan.nl',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [fotos(), cmsVoorbeeld(), zoeken(), pagesRoutes],
});
