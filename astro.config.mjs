import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.scoutingsintsebastiaan.nl',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
