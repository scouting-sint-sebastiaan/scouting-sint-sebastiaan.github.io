// Stuurt preview.scoutingsintsebastiaan.nl door naar www zodra de site openbaar is.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import livegang from '../src/data/livegang.json' with { type: 'json' };

const script =
  "<script>if (location.hostname === 'preview.scoutingsintsebastiaan.nl') location.replace('https://www.scoutingsintsebastiaan.nl' + location.pathname + location.search + location.hash);</script>";

export default function previewDoorsturen() {
  return {
    name: 'preview-doorsturen',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        if (!livegang.live) return;
        const root = fileURLToPath(dir);
        const bestanden = (await readdir(root, { recursive: true })).filter((f) => f.endsWith('.html'));
        for (const f of bestanden) {
          const pad = path.join(root, f);
          const html = await readFile(pad, 'utf8');
          await writeFile(pad, html.replace(/<head[^>]*>/, (m) => m + script));
        }
        logger.info(`doorsturen van preview naar www toegevoegd aan ${bestanden.length} pagina's`);
      },
    },
  };
}
