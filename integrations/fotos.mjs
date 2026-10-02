// Maakt na de build verkleinde WebP-versies van foto's in /uploads/ en laat de HTML die gebruiken.
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const BREEDTES = [400, 800, 1600];
const FOTO = /\.(jpe?g|png|webp)$/i;
const KOLOM = 768;

async function bestanden(map, filter) {
  const items = await readdir(map, { withFileTypes: true, recursive: true }).catch(() => []);
  return items.filter((i) => i.isFile() && filter.test(i.name)).map((i) => path.join(i.parentPath ?? i.path, i.name));
}

async function maakVarianten(uit, logger) {
  const varianten = new Map();
  let voor = 0;
  let na = 0;
  for (const bestand of await bestanden(path.join(uit, 'uploads'), FOTO)) {
    const relatief = path.relative(uit, bestand).split(path.sep).join('/');
    const { width } = await sharp(bestand).metadata();
    if (!width) continue;
    const lijst = [];
    for (const doel of BREEDTES) {
      const breedte = Math.min(doel, width);
      if (lijst.some((v) => v.breedte === breedte)) break;
      const url = `/_fotos/${doel}/${relatief.replace(/^uploads\//, '')}.webp`;
      const pad = path.join(uit, url);
      await mkdir(path.dirname(pad), { recursive: true });
      await sharp(bestand).rotate().resize({ width: breedte, withoutEnlargement: true }).webp({ quality: 78 }).toFile(pad);
      lijst.push({ breedte, url });
    }
    voor += (await stat(bestand)).size;
    na += (await stat(path.join(uit, lijst.at(-1).url))).size;
    lijst.origineel = width;
    for (const sleutel of new Set([`/${relatief}`, encodeURI(`/${relatief}`)])) varianten.set(sleutel, lijst);
  }
  logger.info(`${varianten.size ? new Set(varianten.values()).size : 0} foto's verkleind (${Math.round(voor / 1024)} KB → ${Math.round(na / 1024)} KB op de grootste maat)`);
  return varianten;
}

function herschrijf(html, varianten) {
  let aantal = 0;
  html = html.replace(/<img\b[^>]*>/g, (tag) => {
    const src = tag.match(/\ssrc="([^"]+)"/)?.[1];
    const lijst = src && varianten.get(src);
    if (!lijst || /\ssrcset=/.test(tag)) return tag;
    aantal++;
    const srcset = lijst.map((v) => `${v.url} ${v.breedte}w`).join(', ');
    // Met srcset volgt de weergavegrootte uit sizes; begrens die op de oorspronkelijke breedte.
    const max = Math.min(lijst.origineel, KOLOM);
    const sizes = /\ssizes=/.test(tag) ? '' : ` sizes="(max-width: ${max}px) 100vw, ${max}px"`;
    return tag.replace(/\ssrc="[^"]+"/, ` src="${lijst.at(-1).url}" srcset="${srcset}"${sizes}`);
  });
  html = html.replace(/url\((&#39;|'|&quot;|")?(\/uploads\/[^'")&]+)\1\)/g, (geheel, quote = '', src) => {
    const lijst = varianten.get(src);
    if (!lijst) return geheel;
    aantal++;
    return `url(${quote}${lijst.at(-1).url}${quote})`;
  });
  return { html, aantal };
}

export default function fotos() {
  return {
    name: 'fotos',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const uit = fileURLToPath(dir);
        const varianten = await maakVarianten(uit, logger);
        if (varianten.size === 0) return;
        let totaal = 0;
        for (const bestand of await bestanden(uit, /\.html$/)) {
          const { html, aantal } = herschrijf(await readFile(bestand, 'utf8'), varianten);
          if (aantal > 0) await writeFile(bestand, html);
          totaal += aantal;
        }
        logger.info(`${totaal} verwijzingen naar foto's aangepast`);
      },
    },
  };
}
