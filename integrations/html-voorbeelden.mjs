// Zet de huidige HTML van de vervangbare blokken in de handleiding, als startpunt voor Geavanceerd.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BLOKKEN = {
  footer: /<footer id="voet"[^>]*>([\s\S]*?)<\/footer>/,
  snelNaar: /(<ul class="snel"[^>]*>[\s\S]*?<\/ul>)/,
  oproep: /<section class="oproep"[^>]*>\s*<div class="wrap"[^>]*>\s*<div class="beeld"[^>]*>[\s\S]*?<\/div>\s*<div[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/,
};

const netjes = (html) => html.trim().replace(/>\s*<(?=\/?(div|ul|li|p|h2)\b)/g, '>\n<');
const escape = (html) => html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function htmlVoorbeelden() {
  return {
    name: 'html-voorbeelden',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const uit = fileURLToPath(dir);
        const home = await readFile(`${uit}index.html`, 'utf8');
        let gids = await readFile(`${uit}handleiding/index.html`, 'utf8');
        for (const [naam, patroon] of Object.entries(BLOKKEN)) {
          const html = home.match(patroon)?.[1];
          const plek = new RegExp(`(<pre[^>]*data-voorbeeld="${naam}"[^>]*>)</pre>`);
          if (!html || !plek.test(gids)) throw new Error(`HTML-voorbeeld "${naam}" niet gevonden`);
          gids = gids.replace(plek, (_, open) => `${open}${escape(netjes(html))}</pre>`);
        }
        await writeFile(`${uit}handleiding/index.html`, gids);
        logger.info('HTML-voorbeelden in de handleiding gezet');
      },
    },
  };
}
