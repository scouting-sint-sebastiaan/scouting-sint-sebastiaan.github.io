// Laat links naar andere websites in een nieuw tabblad openen, ook links die in teksten staan.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EIGEN = /^https?:\/\/((www\.|preview\.)?scoutingsintsebastiaan\.nl|([\w-]+\.)?scouting-sint-sebastiaan\.pages\.dev)(\/|$)/i;

export function maakExtern(html) {
  return html.replace(/<a\b[^>]*>/g, (tag) => {
    const href = tag.match(/\shref="([^"]*)"/)?.[1];
    if (!href || !/^https?:\/\//i.test(href) || EIGEN.test(href) || /\starget=/.test(tag)) return tag;
    const rel = tag.match(/\srel="([^"]*)"/)?.[1];
    const zonderRel = rel === undefined ? tag : tag.replace(/\srel="[^"]*"/, '');
    const woorden = new Set([...(rel ?? '').split(/\s+/).filter(Boolean), 'noopener']);
    return zonderRel.replace(/>$/, ` target="_blank" rel="${[...woorden].join(' ')}">`);
  });
}

export default function externeLinks() {
  return {
    name: 'externe-links',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const uit = fileURLToPath(dir);
        const items = await readdir(uit, { withFileTypes: true, recursive: true });
        let pagina = 0;
        for (const i of items) {
          if (!i.isFile() || !i.name.endsWith('.html')) continue;
          const bestand = path.join(i.parentPath ?? i.path, i.name);
          const html = await readFile(bestand, 'utf8');
          const nieuw = maakExtern(html);
          if (nieuw !== html) { await writeFile(bestand, nieuw); pagina++; }
        }
        logger.info(`links naar andere websites openen in een nieuw tabblad (${pagina} pagina's)`);
      },
    },
  };
}
