import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';

// Vóór livegang loopt elke pagina via functions/_middleware.js; daarna alleen de echte Function-routes.
const pagesRoutes = {
  name: 'pages-routes',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const { live } = JSON.parse(readFileSync(new URL('./src/data/livegang.json', import.meta.url), 'utf8'));
      const routes = live
        ? { version: 1, include: ['/auth', '/callback', '/api/*'], exclude: [] }
        : { version: 1, include: ['/*'], exclude: ['/_astro/*', '/uploads/*', '/tc4/*'] };
      writeFileSync(new URL('_routes.json', dir), JSON.stringify(routes, null, 2) + '\n');
    },
  },
};

export default defineConfig({
  site: 'https://www.scoutingsintsebastiaan.nl',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [pagesRoutes],
});
