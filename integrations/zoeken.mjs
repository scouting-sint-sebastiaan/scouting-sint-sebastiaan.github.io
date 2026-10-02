// Bouwt na de build de zoekindex (Pagefind) in /pagefind/; alleen <main data-pagefind-body> wordt doorzocht.
import { fileURLToPath } from 'node:url';
import * as pagefind from 'pagefind';

export default function zoeken() {
  return {
    name: 'zoeken',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const map = fileURLToPath(dir);
        const { index, errors } = await pagefind.createIndex({ forceLanguage: 'nl' });
        if (!index) throw new Error(`Pagefind: ${errors.join(', ')}`);
        const { page_count } = await index.addDirectory({ path: map });
        await index.writeFiles({ outputPath: `${map}pagefind` });
        await pagefind.close();
        logger.info(`zoekindex met ${page_count} pagina's`);
      },
    },
  };
}
